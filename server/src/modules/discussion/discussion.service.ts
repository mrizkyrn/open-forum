import {
  BadRequestException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { Between, EntityManager, Repository } from 'typeorm';
import { UserRole } from '../../common/enums/user-role.enum';
import { Pageable } from '../../common/interfaces/pageable.interface';
import { RedisChannels } from '../../core/redis/redis.constants';
import { RedisService } from '../../core/redis/redis.service';
import { AnalyticService } from '../analytic/analytic.service';
import { ActivityEntityType, ActivityType } from '../analytic/entities/user-activity.entity';
import { AttachmentService } from '../attachment/attachment.service';
import { AttachmentType } from '../attachment/entities/attachment.entity';
import { User } from '../user/entities/user.entity';
import { VoteEntityType } from '../vote/entities/vote.entity';
import { VoteService } from '../vote/vote.service';
import { CreateDiscussionDto } from './dto/create-discussion.dto';
import { DiscussionResponseDto, PopularTagsResponseDto } from './dto/discussion-response.dto';
import { DiscussionSortBy, SearchDiscussionDto } from './dto/search-discussion.dto';
import { UpdateDiscussionDto } from './dto/update-discussion.dto';
import { Bookmark } from './entities/bookmark.entity';
import { DiscussionSpace } from './entities/discussion-space.entity';
import { Discussion } from './entities/discussion.entity';

@Injectable()
export class DiscussionService {
  private readonly logger = new Logger(DiscussionService.name);

  constructor(
    @InjectRepository(Discussion)
    private readonly discussionRepository: Repository<Discussion>,
    @InjectRepository(Bookmark)
    private readonly bookmarkRepository: Repository<Bookmark>,
    @InjectRepository(DiscussionSpace)
    private readonly spaceRepository: Repository<DiscussionSpace>,
    private readonly attachmentService: AttachmentService,
    @Inject(forwardRef(() => VoteService))
    private readonly voteService: VoteService,
    private readonly analyticService: AnalyticService,
    private readonly redisService: RedisService,
  ) {}

  // ------ Discussion CRUD Operations ------

  async create(
    createDiscussionDto: CreateDiscussionDto,
    currentUser: User,
    files?: Express.Multer.File[],
  ): Promise<DiscussionResponseDto> {
    const { clientRequestTime, ...create } = createDiscussionDto;

    if (!currentUser?.id) {
      throw new BadRequestException('User information is required');
    }

    const createdFilePaths: string[] = [];

    try {
      // Validate space if provided
      if (createDiscussionDto.spaceId) {
        const space = await this.spaceRepository.findOne({
          where: { id: createDiscussionDto.spaceId },
        });

        if (!space) {
          throw new NotFoundException(`Discussion space with ID ${createDiscussionDto.spaceId} not found`);
        }
      }

      const queryRunner = this.discussionRepository.manager.connection.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        const discussion = this.discussionRepository.create({
          ...create,
          authorId: currentUser.id,
          commentCount: 0,
          upvoteCount: 0,
          downvoteCount: 0,
        });

        // Process tags if provided (lowercase, remove duplicates, remove empty strings)
        if (createDiscussionDto.tags && createDiscussionDto.tags.length > 0) {
          discussion.tags = this.processTags(createDiscussionDto.tags);
        }

        const savedDiscussion = await queryRunner.manager.save(Discussion, discussion);

        // Process attachments if any
        if (files && files.length > 0) {
          const attachments = await this.attachmentService.createMultipleAttachments(
            files,
            AttachmentType.DISCUSSION,
            discussion.id,
            queryRunner.manager,
          );

          // Track created files for cleanup
          createdFilePaths.push(...this.extractFilePaths(attachments));
        }

        await queryRunner.commitTransaction();

        await this.redisService.publish(RedisChannels.DISCUSSION_CREATED, {
          authorId: currentUser.id,
          discussionId: savedDiscussion.id,
          spaceId: savedDiscussion.spaceId,
          isAnonymous: savedDiscussion.isAnonymous,
          hasTags: (discussion.tags?.length || 0) > 0,
          hasAttachments: files && files.length > 0,
          content: this.truncateContent(savedDiscussion.content, 100),
          clientRequestTime: clientRequestTime || Date.now(),
        });

        const createdDiscussion = await this.getDiscussionById(savedDiscussion.id);

        return DiscussionResponseDto.fromEntity(createdDiscussion, currentUser);
      } catch (error) {
        await queryRunner.rollbackTransaction();
        throw error;
      } finally {
        await queryRunner.release();
      }
    } catch (error) {
      await this.cleanupFiles(createdFilePaths);
      throw error;
    }
  }

  async findAll(searchDto: SearchDiscussionDto, currentUser?: User): Promise<Pageable<DiscussionResponseDto>> {
    const { page, limit } = searchDto;
    const offset = (page - 1) * limit;

    const queryBuilder = this.buildDiscussionSearchQuery(searchDto, offset, limit);
    const [discussions, totalItems] = await queryBuilder.getManyAndCount();

    await this.loadAttachmentsForDiscussions(discussions);

    const responseItems = await Promise.all(
      discussions.map(async (discussion) => {
        let isBookmarked: boolean = false;
        let voteStatus: number | null = null;

        if (currentUser) {
          const [bookmarkStatus, userVote] = await Promise.all([
            this.isDiscussionBookmarked(discussion.id, currentUser.id),
            this.voteService.getUserVoteStatus(currentUser.id, VoteEntityType.DISCUSSION, discussion.id),
          ]);

          isBookmarked = bookmarkStatus;
          voteStatus = userVote;
        }

        return DiscussionResponseDto.fromEntity(discussion, currentUser, isBookmarked, voteStatus);
      }),
    );

    return this.createPaginatedResponse(responseItems, totalItems, page, limit);
  }

  async findById(id: number, currentUser?: User): Promise<DiscussionResponseDto> {
    const discussion = await this.getDiscussionById(id);
    const isBookmarked = currentUser ? await this.isDiscussionBookmarked(discussion.id, currentUser.id) : false;
    const voteStatus = currentUser
      ? await this.voteService.getUserVoteStatus(currentUser.id, VoteEntityType.DISCUSSION, discussion.id)
      : null;

    return DiscussionResponseDto.fromEntity(discussion, currentUser, isBookmarked, voteStatus);
  }

  async update(
    id: number,
    updateDiscussionDto: UpdateDiscussionDto,
    currentUser: User,
    files?: Express.Multer.File[],
  ): Promise<DiscussionResponseDto> {
    let createdFilePaths: string[] = [];

    try {
      const discussion = await this.validateDiscussionAccess(id, currentUser.id);
      const existingAttachments = await this.attachmentService.getAttachmentsByEntity(AttachmentType.DISCUSSION, id);

      // Validate attachment limits
      const attachmentsToRemoveCount = updateDiscussionDto.attachmentsToRemove?.length || 0;
      const newAttachmentsCount = files?.length || 0;
      const remainingAttachmentsCount = existingAttachments.length - attachmentsToRemoveCount;

      if (remainingAttachmentsCount + newAttachmentsCount > 4) {
        throw new BadRequestException(
          'A discussion can have a maximum of 4 attachments. Please remove some existing attachments or upload fewer new ones.',
        );
      }

      // Validate that attachments being removed belong to this discussion
      if (updateDiscussionDto.attachmentsToRemove?.length) {
        for (const attachmentId of updateDiscussionDto.attachmentsToRemove) {
          const attachment = await this.attachmentService.getAttachmentById(attachmentId);

          if (
            !attachment ||
            attachment.entityId !== discussion.id ||
            attachment.entityType !== AttachmentType.DISCUSSION
          ) {
            throw new BadRequestException(`Invalid attachment ID: ${attachmentId}`);
          }
        }
      }

      const queryRunner = this.discussionRepository.manager.connection.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        // Update discussion fields if provided
        if (updateDiscussionDto.content !== undefined) {
          discussion.content = updateDiscussionDto.content;
        }
        if (updateDiscussionDto.isAnonymous !== undefined) {
          discussion.isAnonymous = updateDiscussionDto.isAnonymous;
        }
        if (updateDiscussionDto.tags !== undefined) {
          discussion.tags = this.processTags(updateDiscussionDto.tags);
        }

        discussion.isEdited = true;
        await queryRunner.manager.save(discussion);

        // Remove attachments if specified
        if (updateDiscussionDto.attachmentsToRemove?.length) {
          for (const attachmentId of updateDiscussionDto.attachmentsToRemove) {
            await this.attachmentService.deleteAttachment(attachmentId);
          }
        }

        // Add new attachments if provided
        if (files?.length) {
          const newAttachments = await this.attachmentService.createMultipleAttachments(
            files,
            AttachmentType.DISCUSSION,
            discussion.id,
            queryRunner.manager,
          );

          createdFilePaths = this.extractFilePaths(newAttachments);
        }

        await queryRunner.commitTransaction();

        const updatedDiscussion = await this.getDiscussionById(id);

        // Record edit activity
        await this.analyticService.recordActivity(
          currentUser.id,
          ActivityType.EDIT_DISCUSSION,
          ActivityEntityType.DISCUSSION,
          id,
          {
            spaceId: updatedDiscussion.spaceId,
            isAnonymous: updatedDiscussion.isAnonymous,
            tagsChanged: updateDiscussionDto.tags !== undefined,
            contentChanged: updateDiscussionDto.content !== undefined,
            attachmentsChanged: (updateDiscussionDto.attachmentsToRemove?.length ?? 0) > 0 || (files?.length ?? 0) > 0,
          },
        );

        return DiscussionResponseDto.fromEntity(updatedDiscussion, currentUser);
      } catch (error) {
        await queryRunner.rollbackTransaction();
        throw error;
      } finally {
        await queryRunner.release();
      }
    } catch (error) {
      await this.cleanupFiles(createdFilePaths);
      throw error;
    }
  }

  async delete(id: number, currentUser?: User): Promise<void> {
    if (currentUser) {
      await this.validateDiscussionAccess(id, currentUser.id, currentUser.role);
    }
    await this.discussionRepository.softDelete(id);

    // Record delete activity if user is provided
    if (currentUser) {
      await this.analyticService.recordActivity(
        currentUser.id,
        ActivityType.DELETE_DISCUSSION,
        ActivityEntityType.DISCUSSION,
        id,
        { softDelete: true },
      );
    }
  }

  async hardDelete(id: number, currentUser: User): Promise<void> {
    const discussion = await this.validateDiscussionAccess(id, currentUser.id);

    const queryRunner = this.discussionRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await this.attachmentService.deleteAttachmentsByEntity(AttachmentType.DISCUSSION, id);

      await queryRunner.manager.remove(discussion);

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // ------ Bookmark Operations ------

  async bookmarkDiscussion(discussionId: number, userId: number): Promise<void> {
    // Validate discussion exists
    const discussion = await this.getDiscussionById(discussionId);

    // Check if bookmark already exists
    const existingBookmark = await this.bookmarkRepository.findOne({
      where: { discussionId, userId },
    });

    if (!existingBookmark) {
      const bookmark = this.bookmarkRepository.create({
        discussionId,
        userId,
      });

      await this.bookmarkRepository.save(bookmark);

      // Record bookmark activity
      await this.analyticService.recordActivity(
        userId,
        ActivityType.BOOKMARK_DISCUSSION,
        ActivityEntityType.DISCUSSION,
        discussionId,
        {
          spaceId: discussion.spaceId,
          authorId: discussion.authorId,
        },
      );
    }
  }

  async unbookmarkDiscussion(discussionId: number, userId: number): Promise<void> {
    const bookmark = await this.bookmarkRepository.findOne({
      where: { discussionId, userId },
    });

    if (!bookmark) {
      throw new NotFoundException('Bookmark not found');
    }

    const discussion = await this.getDiscussionById(discussionId);
    await this.bookmarkRepository.remove(bookmark);

    await this.analyticService.recordActivity(
      userId,
      ActivityType.REMOVE_BOOKMARK,
      ActivityEntityType.DISCUSSION,
      discussionId,
      {
        spaceId: discussion.spaceId,
        authorId: discussion.authorId,
      },
    );
  }

  async getBookmarkedDiscussions(
    userId: number,
    searchDto: SearchDiscussionDto,
  ): Promise<Pageable<DiscussionResponseDto>> {
    try {
      const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'DESC' } = searchDto;
      const offset = (page - 1) * limit;

      // Create bookmark-specific query
      const queryBuilder = this.discussionRepository
        .createQueryBuilder('discussion')
        .innerJoin('bookmarks', 'bookmark', 'bookmark.discussion_id = discussion.id AND bookmark.user_id = :userId', {
          userId,
        })
        .leftJoinAndSelect('discussion.author', 'author')
        .leftJoinAndSelect('discussion.space', 'space')
        .orderBy(`discussion.${sortBy}`, sortOrder)
        .skip(offset)
        .take(limit);

      this.applyDiscussionFilters(queryBuilder, searchDto);

      const [discussions, totalItems] = await queryBuilder.getManyAndCount();

      // Load attachments
      await this.loadAttachmentsForDiscussions(discussions);

      // Format response - all items are bookmarked by definition
      const currentUser = { id: userId } as User;
      const responseItems = discussions.map((discussion) => {
        const formatted = DiscussionResponseDto.fromEntity(discussion, currentUser, true);
        formatted.isBookmarked = true;
        return formatted;
      });

      return this.createPaginatedResponse(responseItems, totalItems, page, limit);
    } catch (error) {
      throw error;
    }
  }

  async isDiscussionBookmarked(discussionId: number, userId: number): Promise<boolean> {
    const bookmark = await this.bookmarkRepository.findOne({
      where: { discussionId, userId },
    });
    return !!bookmark;
  }

  // ------ Tag Operations ------

  async getPopularTags(limit: number = 10): Promise<PopularTagsResponseDto[]> {
    const result = await this.discussionRepository
      .createQueryBuilder('discussion')
      .select('unnest(tags) as tag, count(*) as count')
      .groupBy('tag')
      .orderBy('count', 'DESC')
      .limit(limit)
      .getRawMany();

    return result.map((item) => ({
      tag: item.tag,
      count: parseInt(item.count, 10),
    }));
  }

  // ------ Other Operations ------

  async getDiscussionEntity(id: number, relations: string[] = []): Promise<Discussion> {
    const discussion = await this.discussionRepository.findOne({
      where: { id },
      relations,
    });

    if (!discussion) {
      throw new NotFoundException(`Discussion with ID ${id} not found`);
    }

    return discussion;
  }

  async incrementCommentCount(id: number, entityManager?: EntityManager): Promise<void> {
    const manager = entityManager || this.discussionRepository.manager;
    await manager.increment(Discussion, { id }, 'commentCount', 1);
  }

  async decrementCommentCount(id: number, entityManager?: EntityManager): Promise<void> {
    const manager = entityManager || this.discussionRepository.manager;
    const discussion = await manager.findOne(Discussion, { where: { id } });

    if (!discussion) {
      throw new NotFoundException(`Discussion with ID ${id} not found`);
    }

    const newCount = Math.max(0, discussion.commentCount - 1);
    await manager.update(Discussion, { id }, { commentCount: newCount });
  }

  async incrementUpvoteCount(id: number, entityManager?: EntityManager): Promise<void> {
    const manager = entityManager || this.discussionRepository.manager;
    await manager.increment(Discussion, { id }, 'upvoteCount', 1);
  }

  async decrementUpvoteCount(id: number, entityManager?: EntityManager): Promise<void> {
    const manager = entityManager || this.discussionRepository.manager;
    const discussion = await manager.findOne(Discussion, { where: { id } });

    if (!discussion) {
      throw new NotFoundException(`Discussion with ID ${id} not found`);
    }

    const newCount = Math.max(0, discussion.upvoteCount - 1);
    await manager.update(Discussion, { id }, { upvoteCount: newCount });
  }

  async incrementDownvoteCount(id: number, entityManager?: EntityManager): Promise<void> {
    const manager = entityManager || this.discussionRepository.manager;
    await manager.increment(Discussion, { id }, 'downvoteCount', 1);
  }

  async decrementDownvoteCount(id: number, entityManager?: EntityManager): Promise<void> {
    const manager = entityManager || this.discussionRepository.manager;
    const discussion = await manager.findOne(Discussion, { where: { id } });

    if (!discussion) {
      throw new NotFoundException(`Discussion with ID ${id} not found`);
    }

    const newCount = Math.max(0, discussion.downvoteCount - 1);
    await manager.update(Discussion, { id }, { downvoteCount: newCount });
  }

  async countTotal(): Promise<number> {
    return this.discussionRepository.count();
  }

  async countByDateRange(start: Date, end: Date): Promise<number> {
    return this.discussionRepository.count({
      where: { createdAt: Between(start, end) },
    });
  }

  async getTimeSeries(start: Date, end: Date): Promise<{ date: string; count: string }[]> {
    return this.discussionRepository
      .createQueryBuilder('discussion')
      .select(`DATE(discussion.created_at)`, 'date')
      .addSelect(`COUNT(discussion.id)`, 'count')
      .where('discussion.created_at BETWEEN :start AND :end', {
        start,
        end,
      })
      .groupBy(`DATE(discussion.created_at)`)
      .orderBy(`DATE(discussion.created_at)`, 'ASC')
      .getRawMany();
  }

  // ------ Helper Methods ------

  private async getDiscussionById(id: number): Promise<Discussion> {
    const discussion = await this.discussionRepository.findOne({
      where: { id },
      relations: ['author', 'space'],
    });

    if (!discussion) {
      throw new NotFoundException(`Discussion with ID ${id} not found`);
    }

    // Load attachments separately
    const attachments = await this.attachmentService.getAttachmentsByEntity(AttachmentType.DISCUSSION, id);
    discussion.attachments = attachments;

    return discussion;
  }

  private processTags(tags: string[]): string[] {
    return Array.from(new Set(tags.map((tag) => tag.toLowerCase().trim()))).filter(Boolean);
  }

  private async validateDiscussionAccess(
    discussionId: number,
    userId: number,
    userRole?: UserRole,
  ): Promise<Discussion> {
    const discussion = await this.discussionRepository.findOne({
      where: { id: discussionId },
      relations: ['author'],
    });

    if (!discussion) {
      throw new NotFoundException(`Discussion with ID ${discussionId} not found`);
    }

    if (discussion.authorId !== userId && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('You do not have permission to modify this discussion');
    }

    return discussion;
  }

  private buildDiscussionSearchQuery(searchDto: SearchDiscussionDto, offset: number, limit: number) {
    const { sortBy = 'createdAt', sortOrder = 'DESC' } = searchDto;

    const queryBuilder = this.discussionRepository
      .createQueryBuilder('discussion')
      .leftJoinAndSelect('discussion.author', 'author')
      .leftJoinAndSelect('discussion.space', 'space');

    if (sortBy === DiscussionSortBy.voteCount) {
      queryBuilder
        .addSelect('COALESCE(discussion.upvote_count, 0) - COALESCE(discussion.downvote_count, 0)', 'net_votes')
        .addOrderBy('net_votes', sortOrder);
    } else {
      queryBuilder.addOrderBy(`discussion.${sortBy}`, sortOrder);
    }

    queryBuilder.skip(offset).take(limit);

    this.applyDiscussionFilters(queryBuilder, searchDto);

    return queryBuilder;
  }

  private applyDiscussionFilters(queryBuilder, searchDto: SearchDiscussionDto) {
    if (searchDto.search) {
      queryBuilder.andWhere('discussion.content ILIKE :search', { search: `%${searchDto.search}%` });
    }

    if (searchDto.authorId) {
      queryBuilder.andWhere('discussion.authorId = :authorId', { authorId: searchDto.authorId });
      queryBuilder.andWhere('discussion.isAnonymous = false');
    }

    if (searchDto.isAnonymous !== undefined) {
      queryBuilder.andWhere('discussion.isAnonymous = :isAnonymous', { isAnonymous: searchDto.isAnonymous });
    }

    if (searchDto.tags && searchDto.tags.length > 0) {
      queryBuilder.andWhere('discussion.tags && :tags', { tags: searchDto.tags });
    }

    if (searchDto.spaceId) {
      queryBuilder.andWhere('discussion.spaceId = :spaceId', { spaceId: searchDto.spaceId });
    }
  }

  private async loadAttachmentsForDiscussions(discussions: Discussion[]): Promise<void> {
    for (const discussion of discussions) {
      discussion.attachments = await this.attachmentService.getAttachmentsByEntity(
        AttachmentType.DISCUSSION,
        discussion.id,
      );
    }
  }

  private extractFilePaths(attachments: any[]): string[] {
    return attachments.map((attachment) => path.join(process.cwd(), attachment.url.replace(/^\//, '')));
  }

  private async cleanupFiles(filePaths: string[]): Promise<void> {
    for (const filePath of filePaths) {
      try {
        if (fs.existsSync(filePath)) {
          await fs.promises.unlink(filePath);
          this.logger.debug(`Cleaned up file: ${filePath}`);
        }
      } catch (error) {
        this.logger.warn(`Failed to clean up file ${filePath}:`, error);
      }
    }
  }

  private createPaginatedResponse<T>(items: T[], totalItems: number, page: number, limit: number): Pageable<T> {
    const totalPages = Math.ceil(totalItems / limit);

    return {
      items,
      meta: {
        totalItems,
        itemsPerPage: limit,
        currentPage: page,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  private truncateContent(content: string, maxLength: number): string {
    if (!content) return '';
    return content.length > maxLength ? `${content.substring(0, maxLength)}...` : content;
  }
}
