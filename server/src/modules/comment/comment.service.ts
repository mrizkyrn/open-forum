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
import { Between, Brackets, EntityManager, Repository } from 'typeorm';
import { Pageable } from '../../common/interfaces/pageable.interface';
import { WebsocketGateway } from '../../core/websocket/websocket.gateway';
import { AnalyticService } from '../analytic/analytic.service';
import { ActivityEntityType, ActivityType } from '../analytic/entities/user-activity.entity';
import { AttachmentService } from '../attachment/attachment.service';
import { AttachmentType } from '../attachment/entities/attachment.entity';
import { DiscussionService } from '../discussion/discussion.service';
import { NotificationEntityType, NotificationType } from '../notification/entities/notification.entity';
import { NotificationService } from '../notification/notification.service';
import { User } from '../user/entities/user.entity';
import { VoteEntityType } from '../vote/entities/vote.entity';
import { VoteService } from '../vote/vote.service';
import { CommentMentionService } from './comment-mention.service';
import { CommentResponseDto } from './dto/comment-response.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { SearchCommentDto } from './dto/search-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { Comment } from './entities/comment.entity';

export interface CommentCreatedEventData {
  commentId: number;
  discussionId: number;
  spaceId: number;
  authorId: number;
  content: string;
  parentId?: number | null;
  hasAttachments?: boolean;
}

@Injectable()
export class CommentService {
  private readonly logger = new Logger(CommentService.name);

  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    private readonly mentionService: CommentMentionService,
    @Inject(forwardRef(() => DiscussionService))
    private readonly discussionService: DiscussionService,
    private readonly attachmentService: AttachmentService,
    @Inject(forwardRef(() => VoteService))
    private readonly voteService: VoteService,
    private readonly analyticService: AnalyticService,
    private readonly webSocketGateway: WebsocketGateway,
    private readonly notificationService: NotificationService,
  ) {}

  // ----- Core CRUD Operations -----

  async create(
    discussionId: number,
    createCommentDto: CreateCommentDto,
    currentUser: User,
    files?: Express.Multer.File[],
  ): Promise<CommentResponseDto> {
    if (!currentUser || !currentUser.id) {
      throw new BadRequestException('User information is required');
    }

    const createdFilePaths: string[] = [];
    let parentCommentAuthorId: number | undefined;

    try {
      const discussion = await this.discussionService.getDiscussionEntity(discussionId);

      // Check parent comment if this is a reply
      if (createCommentDto.parentId) {
        const parentComment = await this.commentRepository.findOne({
          where: { id: createCommentDto.parentId },
        });

        if (parentComment?.discussionId !== discussionId) {
          throw new BadRequestException('Parent comment must be in the same discussion');
        }

        if (!parentComment) {
          throw new NotFoundException(`Parent comment with ID ${createCommentDto.parentId} not found`);
        }

        // Nested replies are not allowed
        if (parentComment.parentId) {
          throw new BadRequestException('Nested replies are not allowed. You can only reply to top-level comments.');
        }

        parentCommentAuthorId = parentComment.authorId;
      }

      // Limit attachments
      if (files && files.length > 2) {
        throw new BadRequestException('A comment can have a maximum of 2 attachments');
      }

      const queryRunner = this.commentRepository.manager.connection.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        const comment = this.commentRepository.create({
          content: createCommentDto.content,
          authorId: currentUser.id,
          discussionId: discussionId,
          parentId: createCommentDto.parentId || null,
          upvoteCount: 0,
          downvoteCount: 0,
          replyCount: 0,
        });

        const savedComment = await queryRunner.manager.save(Comment, comment);

        // Process mentions
        await this.mentionService.processMentions(
          createCommentDto.content,
          savedComment.id,
          discussionId,
          currentUser.id,
          createCommentDto.parentId,
          parentCommentAuthorId,
          queryRunner.manager,
        );

        // Process files if they exist
        if (files && files.length > 0) {
          const attachments = await this.attachmentService.createMultipleAttachments(
            files,
            AttachmentType.COMMENT,
            savedComment.id,
            queryRunner.manager,
          );

          createdFilePaths.push(...this.extractFilePaths(attachments));
        }

        // Update discussion comment count
        if (createCommentDto.parentId) {
          await this.incrementReplyCount(createCommentDto.parentId, queryRunner.manager);
        }
        await this.discussionService.incrementCommentCount(discussionId, queryRunner.manager);

        // Commit the transaction
        await queryRunner.commitTransaction();

        // Handle Websocket
        await this.webSocketGateway.notifyNewComment({
          id: savedComment.id,
          discussionId: discussionId,
          parentId: savedComment.parentId || null,
        });

        // Handle notifications
        if (savedComment.parentId) {
          // This is a reply to another comment
          const parentComment = await this.commentRepository.findOne({
            where: { id: savedComment.parentId },
            relations: ['author'],
          });

          if (parentComment && parentComment.authorId !== currentUser.id) {
            await this.notificationService.createNotificationIfNotExists(
              {
                recipientId: parentComment.authorId,
                actorId: currentUser.id,
                type: NotificationType.NEW_REPLY,
                entityType: NotificationEntityType.COMMENT,
                entityId: savedComment.id,
                data: {
                  discussionId,
                  parentCommentId: parentComment.id,
                  replyId: savedComment.id,
                  contentPreview: this.truncateContent(savedComment.content, 75),
                  url: `/discussions/${discussionId}?comment=${savedComment.id}`,
                },
              },
              5,
            );
          }
        } else {
          // Comment on a discussion
          if (discussion.authorId !== currentUser.id) {
            await this.notificationService.createNotificationIfNotExists(
              {
                recipientId: discussion.authorId,
                actorId: currentUser.id,
                type: NotificationType.NEW_COMMENT,
                entityType: NotificationEntityType.COMMENT,
                entityId: savedComment.id,
                data: {
                  discussionId,
                  commentId: savedComment.id,
                  contentPreview: this.truncateContent(savedComment.content, 75),
                  url: `/discussions/${discussionId}?comment=${savedComment.id}`,
                },
              },
              5,
            );
          }
        }

        // Record the activity
        await this.analyticService.recordActivity(
          currentUser.id,
          ActivityType.CREATE_COMMENT,
          ActivityEntityType.COMMENT,
          savedComment.id,
          {
            spaceId: discussion.spaceId,
            discussionId: discussionId,
            parentId: savedComment.parentId,
            content: savedComment.content,
            hasAttachments: createdFilePaths.length > 0,
            isReply: !!savedComment.parentId,
          },
        );

        const createdComment = await this.getCommentWithAttachmentById(savedComment.id);
        return CommentResponseDto.fromEntity(createdComment, null);
      } catch (error) {
        await queryRunner.rollbackTransaction();
        throw error;
      } finally {
        await queryRunner.release();
      }
    } catch (error) {
      await this.cleanupFiles(createdFilePaths);
      this.logger.error(`Error creating comment: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findById(id: number, currentUser?: User): Promise<CommentResponseDto> {
    try {
      const comment = await this.getCommentWithAttachmentById(id);

      // Get replies if this is a parent comment
      if (comment.replyCount > 0) {
        comment.replies = await this.commentRepository.find({ where: { parentId: comment.id }, relations: ['author'] });

        for (const reply of comment.replies) {
          reply.attachments = await this.attachmentService.getAttachmentsByEntity(AttachmentType.COMMENT, reply.id);
        }
      }

      const voteStatus = currentUser
        ? await this.voteService.getUserVoteStatus(currentUser.id, VoteEntityType.COMMENT, id)
        : null;

      return CommentResponseDto.fromEntity(comment, voteStatus);
    } catch (error) {
      this.logger.error(`Error fetching comment: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findByDiscussionId(
    discussionId: number,
    searchDto: SearchCommentDto,
    currentUser?: User,
  ): Promise<Pageable<CommentResponseDto>> {
    const { page, limit } = searchDto;
    const offset = (page - 1) * limit;

    const queryBuilder = this.buildCommentSearchQuery(searchDto, discussionId, offset, limit);
    const [comments, totalItems] = await queryBuilder.getManyAndCount();

    // Get attachments for each comment
    for (const comment of comments) {
      if (!comment.deletedAt) {
        comment.attachments = await this.attachmentService.getAttachmentsByEntity(AttachmentType.COMMENT, comment.id);
      } else {
        comment.attachments = [];
      }
    }

    const responseItems = await Promise.all(
      comments.map(async (comment) => {
        let voteStatus: number | null = null;
        if (currentUser && !comment.deletedAt) {
          voteStatus = await this.voteService.getUserVoteStatus(currentUser.id, VoteEntityType.COMMENT, comment.id);
        }

        return CommentResponseDto.fromEntity(comment, voteStatus);
      }),
    );

    return this.createPaginatedResponse(responseItems, totalItems, page, limit);
  }

  async findRepliesByParentId(
    parentId: number,
    searchDto: SearchCommentDto,
    currentUser?: User,
  ): Promise<Pageable<CommentResponseDto>> {
    try {
      const { page, limit, sortBy = 'createdAt', sortOrder = 'ASC' } = searchDto;
      const offset = (page - 1) * limit;

      // Validate parent comment - include withDeleted: true to find soft-deleted comments
      const parentComment = await this.commentRepository.findOne({
        where: { id: parentId },
        withDeleted: true,
      });

      if (!parentComment) {
        throw new NotFoundException(`Comment with ID ${parentId} not found`);
      }

      // Get replies with pagination - these replies should be non-deleted ones
      const queryBuilder = this.commentRepository
        .createQueryBuilder('comment')
        .leftJoinAndSelect('comment.author', 'author')
        .where('comment.parentId = :parentId', { parentId })
        .orderBy(`comment.${sortBy}`, sortOrder)
        .skip(offset)
        .take(limit);

      const [replies, totalItems] = await queryBuilder.getManyAndCount();

      // Get attachments for each reply
      for (const reply of replies) {
        reply.attachments = await this.attachmentService.getAttachmentsByEntity(AttachmentType.COMMENT, reply.id);
      }

      const formattedReplies = await Promise.all(
        replies.map(async (reply) => {
          let voteStatus: number | null = null;
          if (currentUser) {
            voteStatus = await this.voteService.getUserVoteStatus(currentUser.id, VoteEntityType.COMMENT, reply.id);
          }

          return CommentResponseDto.fromEntity(reply, voteStatus);
        }),
      );

      return this.createPaginatedResponse(formattedReplies, totalItems, page, limit);
    } catch (error) {
      this.logger.error(`Error fetching replies: ${error.message}`, error.stack);
      throw error;
    }
  }

  async update(
    id: number,
    updateCommentDto: UpdateCommentDto,
    currentUser: User,
    files?: Express.Multer.File[],
  ): Promise<CommentResponseDto> {
    let createdFilePaths: string[] = [];

    try {
      const comment = await this.commentRepository.findOne({ where: { id } });
      if (!comment) {
        throw new NotFoundException(`Comment with ID ${id} not found`);
      }

      this.verifyCommentAuthor(comment, currentUser.id);

      let parentCommentAuthorId: number | undefined;
      if (comment.parentId) {
        const parentComment = await this.commentRepository.findOne({
          where: { id: comment.parentId },
        });
        parentCommentAuthorId = parentComment?.authorId;
      }

      // Get existing attachments
      const existingAttachments = await this.attachmentService.getAttachmentsByEntity(AttachmentType.COMMENT, id);
      const attachmentsToRemoveCount = updateCommentDto.attachmentsToRemove?.length || 0;
      const newAttachmentsCount = files?.length || 0;
      const remainingAttachmentsCount = existingAttachments.length - attachmentsToRemoveCount;

      if (remainingAttachmentsCount + newAttachmentsCount > 2) {
        throw new BadRequestException(
          'A comment can have a maximum of 2 attachments. Please remove some existing attachments or upload fewer new ones.',
        );
      }

      // Validate that attachments being removed belong to this comment
      if (updateCommentDto.attachmentsToRemove?.length) {
        for (const attachmentId of updateCommentDto.attachmentsToRemove) {
          const attachment = await this.attachmentService.getAttachmentById(attachmentId);

          if (!attachment || attachment.entityId !== comment.id || attachment.entityType !== AttachmentType.COMMENT) {
            throw new BadRequestException(`Invalid attachment ID: ${attachmentId}`);
          }
        }
      }

      const queryRunner = this.commentRepository.manager.connection.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        // Update fields if provided
        if (updateCommentDto.content !== undefined) {
          comment.content = updateCommentDto.content;

          await this.mentionService.updateMentions(
            updateCommentDto.content,
            comment.id,
            comment.discussionId,
            currentUser.id,
            comment.parentId || undefined,
            parentCommentAuthorId,
            queryRunner.manager,
          );
        }

        comment.isEdited = true;
        await queryRunner.manager.save(comment);

        // Remove attachments if specified
        if (updateCommentDto.attachmentsToRemove?.length) {
          for (const attachmentId of updateCommentDto.attachmentsToRemove) {
            await this.attachmentService.deleteAttachment(attachmentId);
          }
        }

        // Add new attachments if provided
        if (files?.length) {
          const newAttachments = await this.attachmentService.createMultipleAttachments(
            files,
            AttachmentType.COMMENT,
            comment.id,
            queryRunner.manager,
          );

          createdFilePaths = this.extractFilePaths(newAttachments);
        }

        await queryRunner.commitTransaction();

        // Fetch the updated comment with attachments
        const updatedComment = await this.getCommentWithAttachmentById(id);
        const voteStatus = await this.voteService.getUserVoteStatus(currentUser.id, VoteEntityType.COMMENT, comment.id);

        // Record edit activity
        await this.analyticService.recordActivity(
          currentUser.id,
          ActivityType.EDIT_COMMENT,
          ActivityEntityType.COMMENT,
          id,
          {
            discussionId: comment.discussionId,
            contentChanged: updateCommentDto.content !== undefined,
            attachmentsChanged: (updateCommentDto.attachmentsToRemove?.length ?? 0) > 0 || (files?.length ?? 0) > 0,
          },
        );

        return CommentResponseDto.fromEntity(updatedComment, voteStatus);
      } catch (error) {
        await queryRunner.rollbackTransaction();
        throw error;
      } finally {
        await queryRunner.release();
      }
    } catch (error) {
      await this.cleanupFiles(createdFilePaths);
      this.logger.error(`Error updating comment: ${error.message}`, error.stack);
      throw error;
    }
  }

  async delete(id: number, currentUser?: User): Promise<void> {
    try {
      const comment = await this.getCommentWithAttachmentById(id);
      if (currentUser) {
        this.verifyCommentAuthor(comment, currentUser.id);
      }

      const queryRunner = this.commentRepository.manager.connection.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        // Delete attachments and soft-delete comment
        if (comment.attachments?.length > 0) {
          await this.attachmentService.deleteAttachmentsByEntity(AttachmentType.COMMENT, id);
        }
        await queryRunner.manager.softDelete(Comment, { id });

        // Update discussion comment count
        if (comment.parentId) {
          await queryRunner.manager.decrement(Comment, { id: comment.parentId }, 'replyCount', 1);
        }
        await this.discussionService.decrementCommentCount(comment.discussionId, queryRunner.manager);

        // Record delete activity
        if (currentUser) {
          await this.analyticService.recordActivity(
            currentUser.id,
            ActivityType.DELETE_COMMENT,
            ActivityEntityType.COMMENT,
            id,
            {
              discussionId: comment.discussionId,
              parentCommentId: comment.parentId,
              hasAttachments: comment.attachments?.length > 0,
              isAuthorDeleting: comment.authorId === currentUser.id,
              isReply: comment.parentId !== null,
            },
          );
        }

        await queryRunner.commitTransaction();
      } catch (error) {
        await queryRunner.rollbackTransaction();
        throw error;
      } finally {
        await queryRunner.release();
      }
    } catch (error) {
      this.logger.error(`Error deleting comment: ${error.message}`, error.stack);
      throw error;
    }
  }

  // ------ Other Operations ------

  async getCommentEntity(id: number, relations: string[] = []): Promise<Comment> {
    const comment = await this.commentRepository.findOne({
      where: { id },
      relations,
    });

    if (!comment) {
      throw new NotFoundException(`Comment with ID ${id} not found`);
    }

    return comment;
  }

  async incrementReplyCount(id: number, entityManager?: EntityManager): Promise<void> {
    const manager = entityManager || this.commentRepository.manager;
    await manager.increment(Comment, { id }, 'replyCount', 1);
  }

  async decrementReplyCount(id: number, entityManager?: EntityManager): Promise<void> {
    const manager = entityManager || this.commentRepository.manager;
    await manager.decrement(Comment, { id }, 'replyCount', 1);
  }

  async incrementUpvoteCount(id: number, entityManager?: EntityManager): Promise<void> {
    const manager = entityManager || this.commentRepository.manager;
    await manager.increment(Comment, { id }, 'upvoteCount', 1);
  }

  async decrementUpvoteCount(id: number, entityManager?: EntityManager): Promise<void> {
    const manager = entityManager || this.commentRepository.manager;
    await manager.decrement(Comment, { id }, 'upvoteCount', 1);
  }

  async incrementDownvoteCount(id: number, entityManager?: EntityManager): Promise<void> {
    const manager = entityManager || this.commentRepository.manager;
    await manager.increment(Comment, { id }, 'downvoteCount', 1);
  }

  async decrementDownvoteCount(id: number, entityManager?: EntityManager): Promise<void> {
    const manager = entityManager || this.commentRepository.manager;
    await manager.decrement(Comment, { id }, 'downvoteCount', 1);
  }

  async countByDateRange(start: Date, end: Date): Promise<number> {
    return this.commentRepository.count({
      where: { createdAt: Between(start, end) },
    });
  }

  async getTimeSeries(start: Date, end: Date): Promise<{ date: string; count: string }[]> {
    const results = await this.commentRepository
      .createQueryBuilder('comment')
      .select(`DATE(comment.createdAt)`, 'date')
      .addSelect(`COUNT(comment.id)`, 'count')
      .where('comment.createdAt BETWEEN :start AND :end', {
        start,
        end,
      })
      .groupBy(`DATE(comment.createdAt)`)
      .orderBy(`DATE(comment.createdAt)`, 'ASC')
      .getRawMany();

    return results;
  }

  // ----- Helper Methods -----

  async getCommentWithAttachmentById(id: number): Promise<Comment> {
    const comment = await this.commentRepository.findOne({
      where: { id },
      relations: ['author'],
    });

    if (!comment) {
      throw new NotFoundException(`Comment with ID ${id} not found`);
    }

    const attachments = await this.attachmentService.getAttachmentsByEntity(AttachmentType.COMMENT, id);
    comment.attachments = attachments;

    return comment;
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

  private buildCommentSearchQuery(searchDto: SearchCommentDto, discussionId: number, offset: number, limit: number) {
    const { sortBy = 'createdAt', sortOrder = 'DESC' } = searchDto;

    const queryBuilder = this.commentRepository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.author', 'author')
      .where('comment.discussionId = :discussionId', { discussionId })
      .andWhere('comment.parentId IS NULL')
      .orderBy(`comment.${sortBy}`, sortOrder)
      .skip(offset)
      .take(limit);

    queryBuilder.withDeleted().andWhere(
      new Brackets((qb) => {
        qb.where('comment.deletedAt IS NULL').orWhere('comment.replyCount > 0');
      }),
    );

    return queryBuilder;
  }

  private verifyCommentAuthor(comment: Comment, userId: number): void {
    if (comment.authorId !== userId) {
      throw new ForbiddenException('You do not have permission to modify this comment');
    }
  }

  private async cleanupFiles(filePaths: string[]): Promise<void> {
    for (const filePath of filePaths) {
      try {
        if (fs.existsSync(filePath)) {
          await fs.promises.unlink(filePath);
        }
      } catch (error) {
        this.logger.warn(`Failed to clean up file ${filePath}`, error);
      }
    }
  }

  private extractFilePaths(attachments: any[]): string[] {
    return attachments.map((attachment) => path.join(process.cwd(), attachment.url.replace(/^\//, '')));
  }

  private truncateContent(content: string, maxLength: number): string {
    if (!content) return '';
    return content.length > maxLength ? `${content.substring(0, maxLength)}...` : content;
  }
}
