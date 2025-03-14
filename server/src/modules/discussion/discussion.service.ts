import * as path from 'path';
import * as fs from 'fs';
import {
  Injectable,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Discussion } from './entities/discussion.entity';
import { CreateDiscussionDto } from './dto/create-discussion.dto';
import { User } from '../user/entities/user.entity';
import { AttachmentService } from '../attachment/attachment.service';
import { AttachmentType } from '../attachment/entities/attachment.entity';
import { DiscussionResponseDto } from './dto/discussion-response.dto';
import { Bookmark } from './entities/bookmark.entity';
import { SearchDiscussionDto } from './dto/search-discussion.dto';
import { Pageable } from '../../common/interfaces/pageable.interface';
import { UpdateDiscussionDto } from './dto/update-discussion.dto';
import { VoteService } from '../vote/vote.service';
import { VoteEntityType } from '../vote/entities/vote.entity';
import { WebsocketGateway } from 'src/core/websocket/websocket.gateway';
import { DiscussionSpace } from './entities/discussion-space.entity';

@Injectable()
export class DiscussionService {
  constructor(
    @InjectRepository(Discussion)
    private readonly discussionRepository: Repository<Discussion>,
    @InjectRepository(Bookmark)
    private readonly bookmarkRepository: Repository<Bookmark>,
    @InjectRepository(DiscussionSpace)
    private readonly spaceRepository: Repository<DiscussionSpace>,
    private readonly attachmentService: AttachmentService,
    private readonly voteService: VoteService,
    private readonly websocketGateway: WebsocketGateway,
  ) {}

  async create(
    createDiscussionDto: CreateDiscussionDto,
    currentUser: User,
    files?: Express.Multer.File[],
  ): Promise<Discussion> {
    const createdFilePaths: string[] = [];

    try {
      // Validate input
      if (!createDiscussionDto.content?.trim()) {
        throw new BadRequestException('Discussion content is required');
      }

      if (!currentUser || !currentUser.id) {
        throw new BadRequestException('User information is required');
      }

      // Check if the user is allowed to create a discussion in the specified space
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
          ...createDiscussionDto,
          authorId: currentUser.id,
          commentCount: 0,
          upvoteCount: 0,
          downvoteCount: 0,
        });

        // Set tags if available
        if (createDiscussionDto.tags && createDiscussionDto.tags.length > 0) {
          // Process tags (lowercase, remove duplicates, remove empty strings)
          discussion.tags = Array.from(new Set(createDiscussionDto.tags.map((tag) => tag.toLowerCase().trim()))).filter(
            Boolean,
          );
        }

        const savedDiscussion = await queryRunner.manager.save(Discussion, discussion);

        // Process files if they exist
        if (files && files.length > 0) {
          const attachments = await this.attachmentService.createMultipleAttachments(
            files,
            AttachmentType.DISCUSSION,
            savedDiscussion.id,
            queryRunner.manager,
          );

          // Track created file paths for cleanup
          for (const attachment of attachments) {
            const fullPath = path.join(process.cwd(), attachment.url.replace(/^\//, ''));
            createdFilePaths.push(fullPath);
          }
        }

        // Commit the transaction
        await queryRunner.commitTransaction();

        const createdDiscussion = await this.getDiscussionById(savedDiscussion.id);

        this.websocketGateway.notifyNewDiscussion(createdDiscussion.authorId);
        if (createdDiscussion.spaceId !== 1) {
          this.websocketGateway.notifyNewSpaceDiscussion(createdDiscussion.authorId, createdDiscussion.spaceId);
        }

        return createdDiscussion;
      } catch (error) {
        await queryRunner.rollbackTransaction();

        await this.cleanupFiles(createdFilePaths);

        throw error;
      } finally {
        await queryRunner.release();
      }
    } catch (error) {
      await this.cleanupFiles(createdFilePaths);

      if (error instanceof BadRequestException) {
        throw error;
      }

      console.error('Error creating discussion with attachments:', error);

      throw error;
    }
  }

  async findAll(searchDto: SearchDiscussionDto, currentUser?: User): Promise<Pageable<DiscussionResponseDto>> {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'DESC' } = searchDto;

    const offset = (page - 1) * limit;

    const queryBuilder = this.discussionRepository
      .createQueryBuilder('discussion')
      .leftJoinAndSelect('discussion.author', 'author')
      .leftJoinAndSelect('discussion.space', 'space')
      .orderBy(`discussion.${sortBy}`, sortOrder)
      .skip(offset)
      .take(limit);

    // Apply filters
    if (searchDto.search) {
      queryBuilder.andWhere('discussion.content ILIKE :search', { search: `%${searchDto.search}%` });
    }

    if (searchDto.authorId) {
      queryBuilder.andWhere('discussion.authorId = :authorId', { authorId: searchDto.authorId });
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

    const [discussions, totalItems] = await queryBuilder.getManyAndCount();

    // Get attachments for each discussion
    for (const discussion of discussions) {
      discussion.attachments = await this.attachmentService.getAttachmentsByEntity(
        AttachmentType.DISCUSSION,
        discussion.id,
      );
    }

    // Format discussions and add bookmark status
    const responseItems: DiscussionResponseDto[] = [];

    for (const discussion of discussions) {
      const formatted = this.formatDiscussionResponse(discussion, currentUser);

      if (currentUser) {
        formatted.isBookmarked = await this.isDiscussionBookmarked(discussion.id, currentUser.id);
        formatted.voteStatus = await this.voteService.getUserVoteStatus(
          currentUser.id,
          VoteEntityType.DISCUSSION,
          discussion.id,
        );
      }

      responseItems.push(formatted);
    }

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalItems / limit);

    return {
      items: responseItems,
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

  async findById(id: number, currentUser?: User): Promise<DiscussionResponseDto> {
    const discussion = await this.getDiscussionById(id);

    const response = this.formatDiscussionResponse(discussion, currentUser);

    if (currentUser) {
      response.isBookmarked = await this.isDiscussionBookmarked(discussion.id, currentUser.id);
      response.voteStatus = await this.voteService.getUserVoteStatus(
        currentUser.id,
        VoteEntityType.DISCUSSION,
        discussion.id,
      );
    }

    return response;
  }

  async update(
    id: number,
    updateDiscussionDto: UpdateDiscussionDto,
    currentUser: User,
    files?: Express.Multer.File[],
  ): Promise<DiscussionResponseDto> {
    const discussion = await this.discussionRepository.findOne({
      where: { id },
      relations: ['author'],
    });

    if (!discussion) {
      throw new NotFoundException(`Discussion with ID ${id} not found`);
    }

    // Check if the current user is the author
    if (discussion.authorId !== currentUser.id) {
      throw new ForbiddenException('You do not have permission to update this discussion');
    }

    // Get existing attachments
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

    const createdFilePaths: string[] = [];

    const queryRunner = this.discussionRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Update fields if provided
      if (updateDiscussionDto.content !== undefined) {
        discussion.content = updateDiscussionDto.content;
      }

      if (updateDiscussionDto.isAnonymous !== undefined) {
        discussion.isAnonymous = updateDiscussionDto.isAnonymous;
      }

      if (updateDiscussionDto.tags) {
        discussion.tags = Array.from(new Set(updateDiscussionDto.tags.map((tag) => tag.toLowerCase().trim()))).filter(
          Boolean,
        );
      }

      // Save the updated discussion
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

        for (const attachment of newAttachments) {
          const fullPath = path.join(process.cwd(), attachment.url.replace(/^\//, ''));
          createdFilePaths.push(fullPath);
        }
      }

      await queryRunner.commitTransaction();

      const updatedDiscussion = await this.getDiscussionById(id);
      return this.formatDiscussionResponse(updatedDiscussion, currentUser);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      await this.cleanupFiles(createdFilePaths);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async delete(id: number, currentUser: User): Promise<void> {
    const discussion = await this.getDiscussionById(id);

    if (discussion.authorId !== currentUser.id) {
      throw new ForbiddenException('You do not have permission to delete this discussion');
    }

    await this.discussionRepository.softDelete(id);
  }

  async hardDelete(id: number, currentUser: User): Promise<void> {
    const discussion = await this.getDiscussionById(id);

    if (discussion.authorId !== currentUser.id) {
      throw new ForbiddenException('You do not have permission to delete this discussion');
    }

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

  async getPopularTags(limit: number = 20): Promise<{ tag: string; count: number }[]> {
    const result = await this.discussionRepository
      .createQueryBuilder('discussion')
      .select('unnest(tags) as tag, count(*) as count')
      .groupBy('tag')
      .orderBy('count', 'DESC')
      .limit(limit)
      .getRawMany();

    return result;
  }

  async bookmarkDiscussion(discussionId: number, userId: number): Promise<void> {
    const discussion = await this.getDiscussionById(discussionId);

    if (!discussion) {
      throw new NotFoundException(`Discussion with ID ${discussionId} not found`);
    }

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
    }
  }

  async unbookmarkDiscussion(discussionId: number, userId: number): Promise<void> {
    const bookmark = await this.bookmarkRepository.findOne({
      where: { discussionId, userId },
    });

    if (!bookmark) {
      throw new NotFoundException('Bookmark not found');
    }

    await this.bookmarkRepository.remove(bookmark);
  }

  async getBookmarkedDiscussions(
    userId: number,
    searchDto: SearchDiscussionDto,
  ): Promise<Pageable<DiscussionResponseDto>> {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'DESC' } = searchDto;

    // Calculate offset
    const offset = (page - 1) * limit;

    // Create query for bookmarked discussions
    const queryBuilder = this.discussionRepository
      .createQueryBuilder('discussion')
      .innerJoin('bookmarks', 'bookmark', 'bookmark.discussion_id = discussion.id AND bookmark.user_id = :userId', {
        userId,
      })
      .leftJoinAndSelect('discussion.author', 'author')
      .orderBy(`discussion.${sortBy}`, sortOrder)
      .skip(offset)
      .take(limit);

    // Apply additional filters
    if (searchDto.search) {
      queryBuilder.andWhere('discussion.content ILIKE :search', { search: `%${searchDto.search}%` });
    }

    if (searchDto.authorId) {
      queryBuilder.andWhere('discussion.authorId = :authorId', { authorId: searchDto.authorId });
    }

    if (searchDto.isAnonymous !== undefined) {
      queryBuilder.andWhere('discussion.isAnonymous = :isAnonymous', { isAnonymous: searchDto.isAnonymous });
    }

    if (searchDto.tags && searchDto.tags.length > 0) {
      queryBuilder.andWhere('discussion.tags && :tags', { tags: searchDto.tags });
    }

    if (searchDto.tags && searchDto.tags.length > 0) {
      // Handle array of tags (find discussions that have any of the tags)
      queryBuilder.andWhere('discussion.tags && :tags', { tags: searchDto.tags });
    }

    const [discussions, totalItems] = await queryBuilder.getManyAndCount();

    // Get attachments for each discussion
    for (const discussion of discussions) {
      discussion.attachments = await this.attachmentService.getAttachmentsByEntity(
        AttachmentType.DISCUSSION,
        discussion.id,
      );
    }

    // Format response and add bookmarked status (all true in this case)
    const currentUser = { id: userId } as User;
    const responseItems = discussions.map((discussion) => {
      const formatted = this.formatDiscussionResponse(discussion, currentUser);
      formatted.isBookmarked = true; // These are all bookmarked
      return formatted;
    });

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalItems / limit);

    return {
      items: responseItems,
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

  async isDiscussionBookmarked(discussionId: number, userId: number): Promise<boolean> {
    const bookmark = await this.bookmarkRepository.findOne({
      where: { discussionId, userId },
    });
    return !!bookmark;
  }

  private async getDiscussionById(id: number): Promise<Discussion> {
    const discussion = await this.discussionRepository.findOne({
      where: { id },
      relations: ['author', 'space'],
    });

    if (!discussion) {
      throw new NotFoundException(`Discussion with ID ${id} not found`);
    }

    const attachments = await this.attachmentService.getAttachmentsByEntity(AttachmentType.DISCUSSION, id);
    discussion.attachments = attachments;

    return discussion;
  }

  private async cleanupFiles(filePaths: string[]): Promise<void> {
    for (const filePath of filePaths) {
      try {
        if (fs.existsSync(filePath)) {
          await fs.promises.unlink(filePath);
          console.log(`Cleaned up file: ${filePath}`);
        }
      } catch (error) {
        console.error(`Failed to clean up file ${filePath}:`, error);
      }
    }
  }

  formatDiscussionResponse(discussion: Discussion, currentUser?: User): DiscussionResponseDto {
    const response = {
      id: discussion.id,
      content: discussion.content,
      isAnonymous: discussion.isAnonymous,
      tags: discussion.tags || [],
      createdAt: discussion.createdAt,
      updatedAt: discussion.updatedAt,
      commentCount: discussion.commentCount,
      upvoteCount: discussion.upvoteCount,
      downvoteCount: discussion.downvoteCount,
      attachments: discussion.attachments || [],
      isBookmarked: false,
      space: !discussion.space
        ? null
        : {
            id: discussion.space.id,
            name: discussion.space.name,
            slug: discussion.space.slug,
          },
      author: !discussion.isAnonymous
        ? {
            id: discussion.author.id,
            username: discussion.author.username,
            fullName: discussion.author.fullName,
            role: discussion.author.role,
            avatarUrl: discussion.author.avatarUrl || null,
            createdAt: discussion.author.createdAt,
            updatedAt: discussion.author.updatedAt,
          }
        : null,
    };

    // Show author to the author themselves, even on anonymous posts
    if (discussion.isAnonymous && currentUser && currentUser.id === discussion.authorId) {
      response.author = {
        id: discussion.author.id,
        username: '(You - Anonymous)',
        fullName: '(You - Anonymous)',
        role: discussion.author.role,
        avatarUrl: null,
        createdAt: discussion.author.createdAt,
        updatedAt: discussion.author.updatedAt,
      };
    }

    // Sort attachments by display order
    if (response.attachments && response.attachments.length > 0) {
      response.attachments.sort((a, b) => a.displayOrder - b.displayOrder);
    }

    return response;
  }
}
