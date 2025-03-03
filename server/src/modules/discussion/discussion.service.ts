import * as path from 'path';
import * as fs from 'fs';
import { Injectable, BadRequestException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Discussion } from './entities/discussion.entity';
import { CreateDiscussionDto } from './dto/create-discussion.dto';
import { User } from '../user/entities/user.entity';
import { AttachmentService } from '../attachment/attachment.service';
import { Attachment, AttachmentType } from '../attachment/entities/attachment.entity';
import { UserResponseDto } from '../user/dto/user-response.dto';
import { DiscussionResponseDto } from './dto/discussion-response.dto';

@Injectable()
export class DiscussionService {
  constructor(
    @InjectRepository(Discussion)
    private readonly discussionRepository: Repository<Discussion>,
    private readonly attachmentService: AttachmentService,
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

        return this.findById(savedDiscussion.id);
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

      throw new InternalServerErrorException(
        'An error occurred while creating the discussion. Please try again later.',
      );
    }
  }

  async findById(id: number): Promise<Discussion> {
    const discussion = await this.discussionRepository.findOne({
      where: { id },
      relations: ['author'],
    });

    if (!discussion) {
      throw new NotFoundException(`Discussion with ID ${id} not found`);
    }

    const attachments = await this.attachmentService.getAttachmentsByEntity(AttachmentType.DISCUSSION, id);

    discussion.attachments = attachments;
    return discussion;
  }

  formatDiscussionResponse(discussion: Discussion, currentUser?: User): DiscussionResponseDto {
    let author: UserResponseDto | null = null;
    if (!discussion.isAnonymous) {
      author = {
        id: discussion.author?.id,
        username: discussion.author?.username,
        fullName: discussion.author?.fullName,
        role: discussion.author?.role,
        createdAt: discussion.author?.createdAt,
        updatedAt: discussion.author?.updatedAt,
      };
    } else if (currentUser && discussion.authorId === currentUser.id) {
      author = {
        id: discussion.author?.id,
        username: '(You - Anonymous)',
        fullName: '(You - Anonymous)',
        role: discussion.author?.role,
        createdAt: discussion.author?.createdAt,
        updatedAt: discussion.author?.updatedAt,
      };
    }

    // Get attachments if available and sort by display order
    let attachments: Attachment[] = [];
    if (discussion.attachments && discussion.attachments.length > 0) {
      attachments = discussion.attachments.sort((a, b) => a.displayOrder - b.displayOrder);
    }

    return {
      id: discussion.id,
      content: discussion.content,
      isAnonymous: discussion.isAnonymous,
      tags: discussion.tags || [],
      createdAt: discussion.createdAt,
      updatedAt: discussion.updatedAt,
      author,
      attachments,
      commentCount: discussion.commentCount || 0,
      upvoteCount: discussion.upvoteCount || 0,
      downvoteCount: discussion.downvoteCount || 0,
    };
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
