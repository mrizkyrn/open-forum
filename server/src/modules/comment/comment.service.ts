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
import { Comment } from './entities/comment.entity';
import { Discussion } from '../discussion/entities/discussion.entity';
import { User } from '../user/entities/user.entity';
import { AttachmentService } from '../attachment/attachment.service';
import { AttachmentType } from '../attachment/entities/attachment.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CommentResponseDto } from './dto/comment-response.dto';
import { Pageable } from '../../common/interfaces/pageable.interface';
import { SearchCommentDto } from './dto/search-comment.dto';

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    @InjectRepository(Discussion)
    private readonly discussionRepository: Repository<Discussion>,
    private readonly attachmentService: AttachmentService,
  ) {}

  async create(
    discussionId: number,
    createCommentDto: CreateCommentDto,
    currentUser: User,
    files?: Express.Multer.File[],
  ): Promise<CommentResponseDto> {
    const createdFilePaths: string[] = [];

    try {
      // Validate input
      if (!createCommentDto.content?.trim()) {
        throw new BadRequestException('Comment content is required');
      }

      if (!currentUser || !currentUser.id) {
        throw new BadRequestException('User information is required');
      }

      // Check if discussion exists
      const discussion = await this.discussionRepository.findOne({ where: { id: discussionId } });
      if (!discussion) {
        throw new NotFoundException(`Discussion with ID ${discussionId} not found`);
      }

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
      }

      // Limit attachments
      if (files && files.length > 2) {
        throw new BadRequestException('A comment can have a maximum of 2 attachments');
      }

      const queryRunner = this.commentRepository.manager.connection.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        // Create comment
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

        // Process files if they exist
        if (files && files.length > 0) {
          const attachments = await this.attachmentService.createMultipleAttachments(
            files,
            AttachmentType.COMMENT,
            savedComment.id,
            queryRunner.manager,
          );

          // Track created file paths for cleanup in case of error
          for (const attachment of attachments) {
            const fullPath = path.join(process.cwd(), attachment.url.replace(/^\//, ''));
            createdFilePaths.push(fullPath);
          }
        }

        // Update parent comment reply count if this is a reply
        if (createCommentDto.parentId) {
          await queryRunner.manager.increment(Comment, { id: createCommentDto.parentId }, 'replyCount', 1);
        }

        // Update discussion comment count
        await queryRunner.manager.increment(Discussion, { id: discussionId }, 'commentCount', 1);

        // Commit the transaction
        await queryRunner.commitTransaction();

        // Fetch the complete comment with all relations
        const createdComment = await this.getCommentById(savedComment.id);
        return this.formatCommentResponse(createdComment);
      } catch (error) {
        await queryRunner.rollbackTransaction();
        await this.cleanupFiles(createdFilePaths);
        throw error;
      } finally {
        await queryRunner.release();
      }
    } catch (error) {
      await this.cleanupFiles(createdFilePaths);

      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }

      console.error('Error creating comment with attachments:', error);
      throw new InternalServerErrorException('An error occurred while creating the comment. Please try again later.');
    }
  }

  async findById(id: number): Promise<CommentResponseDto> {
    const comment = await this.getCommentById(id);

    // Get replies if this is a parent comment
    if (comment.replyCount > 0) {
      comment.replies = await this.findRepliesByParentId(comment.id);

      // Get attachments for each reply
      for (const reply of comment.replies) {
        reply.attachments = await this.attachmentService.getAttachmentsByEntity(AttachmentType.COMMENT, reply.id);
      }
    }

    return this.formatCommentResponse(comment);
  }

  async findByDiscussionId(discussionId: number, searchDto: SearchCommentDto): Promise<Pageable<CommentResponseDto>> {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'DESC' } = searchDto;
    const offset = (page - 1) * limit;

    // Get top-level comments only (where parentId is null)
    const queryBuilder = this.commentRepository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.author', 'author')
      .where('comment.discussionId = :discussionId', { discussionId })
      .andWhere('comment.parentId IS NULL')
      .orderBy(`comment.${sortBy}`, sortOrder)
      .skip(offset)
      .take(limit);

    const [comments, totalItems] = await queryBuilder.getManyAndCount();

    // Get attachments for each comment
    for (const comment of comments) {
      comment.attachments = await this.attachmentService.getAttachmentsByEntity(AttachmentType.COMMENT, comment.id);
    }

    // Format comments
    const responseItems: CommentResponseDto[] = [];
    for (const comment of comments) {
      const formatted = this.formatCommentResponse(comment);
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

  async findRepliesByParentId(parentId: number): Promise<Comment[]> {
    const replies = await this.commentRepository.find({
      where: { parentId },
      relations: ['author'],
      order: { createdAt: 'ASC' },
    });

    for (const reply of replies) {
      reply.attachments = await this.attachmentService.getAttachmentsByEntity(AttachmentType.COMMENT, reply.id);
    }

    return replies;
  }

  async getCommentById(id: number): Promise<Comment> {
    const comment = await this.commentRepository.findOne({
      where: { id },
      relations: ['author'],
    });

    if (!comment) {
      throw new NotFoundException(`Comment with ID ${id} not found`);
    }

    // Fetch attachments
    const attachments = await this.attachmentService.getAttachmentsByEntity(AttachmentType.COMMENT, id);
    comment.attachments = attachments;

    return comment;
  }

  formatCommentResponse(comment: Comment): CommentResponseDto {
    const response = {
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      discussionId: comment.discussionId,
      parentId: comment.parentId,
      upvoteCount: comment.upvoteCount,
      downvoteCount: comment.downvoteCount,
      replyCount: comment.replyCount,
      attachments: comment.attachments || [],
      author: {
        id: comment.author.id,
        username: comment.author.username,
        fullName: comment.author.fullName,
        role: comment.author.role,
        createdAt: comment.author.createdAt,
        updatedAt: comment.author.updatedAt,
      },
      replies: comment.replies ? comment.replies.map((reply) => this.formatCommentResponse(reply)) : undefined,
    };

    // Sort attachments by display order
    if (response.attachments && response.attachments.length > 0) {
      response.attachments.sort((a, b) => a.displayOrder - b.displayOrder);
    }

    return response;
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
}
