import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vote, VoteEntityType, VoteValue } from './entities/vote.entity';
import { Discussion } from '../discussion/entities/discussion.entity';
import { Comment } from '../comment/entities/comment.entity';
import { User } from '../user/entities/user.entity';
import { VoteCountsDto, VoteResponseDto } from './dto/vote-response.dto';
import { NotificationEntityType, NotificationType } from '../notification/entities/notification.entity';
import { UserService } from '../user/user.service';
import { NotificationService } from '../notification/notification.service';
import { WebsocketGateway } from 'src/core/websocket/websocket.gateway';

@Injectable()
export class VoteService {
  constructor(
    @InjectRepository(Vote)
    private readonly voteRepository: Repository<Vote>,
    @InjectRepository(Discussion)
    private readonly discussionRepository: Repository<Discussion>,
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    private readonly userService: UserService,
    private readonly notificationService: NotificationService,
    private readonly websocketGateway: WebsocketGateway,
  ) {}

  async voteDiscussion(userId: number, discussionId: number, value: VoteValue): Promise<VoteResponseDto | null> {
    const queryRunner = this.discussionRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const discussion = await queryRunner.manager.findOne(Discussion, {
        where: { id: discussionId },
        relations: ['author'], // Add author relation
      });

      if (!discussion) {
        throw new NotFoundException('Discussion not found');
      }

      const existingVote = await queryRunner.manager.findOne(Vote, {
        where: {
          user: { id: userId },
          entityType: VoteEntityType.DISCUSSION,
          entityId: discussionId,
        },
        relations: ['user'],
      });

      let result: Vote | null = null;
      let shouldNotify = false;

      if (existingVote) {
        // If same vote exists, remove it (toggle behavior)
        if (existingVote.value === value) {
          await queryRunner.manager.remove(existingVote);
          if (value === VoteValue.UPVOTE) {
            discussion.upvoteCount = Math.max(0, discussion.upvoteCount - 1);
          } else {
            discussion.downvoteCount = Math.max(0, discussion.downvoteCount - 1);
          }
        } else {
          // Update existing vote
          existingVote.value = value;
          result = await queryRunner.manager.save(Vote, existingVote);

          if (value === VoteValue.UPVOTE) {
            console.log('Upvote');
            discussion.upvoteCount += 1;
            discussion.downvoteCount -= 1;
            shouldNotify = true;
          } else {
            discussion.downvoteCount += 1;
            discussion.upvoteCount -= 1;
          }
        }
      } else {
        // Create new vote
        const vote = queryRunner.manager.create(Vote, {
          user: { id: userId },
          entityType: VoteEntityType.DISCUSSION,
          entityId: discussionId,
          value,
        });

        result = await queryRunner.manager.save(Vote, vote);

        if (value === VoteValue.UPVOTE) {
          discussion.upvoteCount += 1;
          shouldNotify = true;
        } else {
          discussion.downvoteCount += 1;
        }
      }

      // Ensure counts are never negative
      discussion.upvoteCount = Math.max(0, discussion.upvoteCount);
      discussion.downvoteCount = Math.max(0, discussion.downvoteCount);

      await queryRunner.manager.save(Discussion, discussion);
      await queryRunner.commitTransaction();

      // Create notification after successful transaction
      if (shouldNotify && discussion.authorId !== userId) {
        await this.createVoteNotification(VoteEntityType.DISCUSSION, discussionId, userId, discussion.authorId, value);
      }

      return result ? this.formatVoteResponse(result) : null;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async voteComment(userId: number, commentId: number, value: VoteValue): Promise<VoteResponseDto | null> {
    // Use a transaction for data consistency
    const queryRunner = this.commentRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Add author relation to get the comment author id
      const comment = await queryRunner.manager.findOne(Comment, {
        where: { id: commentId },
        relations: ['author'], // Add this relation
      });

      if (!comment) {
        throw new NotFoundException('Comment not found');
      }

      // Check for existing vote within transaction
      const existingVote = await queryRunner.manager.findOne(Vote, {
        where: {
          user: { id: userId },
          entityType: VoteEntityType.COMMENT,
          entityId: commentId,
        },
        relations: ['user'],
      });

      let result: Vote | null = null;
      let shouldNotify = false; // Add flag to track when notification should be sent

      if (existingVote) {
        // If same vote exists, remove it (toggle behavior)
        if (existingVote.value === value) {
          await queryRunner.manager.remove(existingVote);
          if (value === VoteValue.UPVOTE) {
            comment.upvoteCount = Math.max(0, comment.upvoteCount - 1);
          } else {
            comment.downvoteCount = Math.max(0, comment.downvoteCount - 1);
          }
          // result remains null (vote removed)
        } else {
          // Change vote direction
          existingVote.value = value;
          result = await queryRunner.manager.save(Vote, existingVote);

          if (value === VoteValue.UPVOTE) {
            comment.upvoteCount += 1;
            comment.downvoteCount -= 1;
            shouldNotify = true; // Set flag when downvote changed to upvote
          } else {
            comment.downvoteCount += 1;
            comment.upvoteCount -= 1;
          }
        }
      } else {
        // Create new vote
        const vote = queryRunner.manager.create(Vote, {
          user: { id: userId },
          entityType: VoteEntityType.COMMENT,
          entityId: commentId,
          value,
        });

        result = await queryRunner.manager.save(Vote, vote);

        if (value === VoteValue.UPVOTE) {
          comment.upvoteCount += 1;
          shouldNotify = true; // Set flag when new upvote created
        } else {
          comment.downvoteCount += 1;
        }
      }

      // Ensure counts are never negative
      comment.upvoteCount = Math.max(0, comment.upvoteCount);
      comment.downvoteCount = Math.max(0, comment.downvoteCount);

      await queryRunner.manager.save(Comment, comment);
      await queryRunner.commitTransaction();

      // Create notification after successful transaction
      if (shouldNotify && comment.author.id !== userId) {
        await this.createVoteNotification(VoteEntityType.COMMENT, commentId, userId, comment.author.id, value);
      }

      return result ? this.formatVoteResponse(result) : null;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getUserVoteStatus(userId: number, entityType: VoteEntityType, entityId: number): Promise<number | null> {
    const vote = await this.voteRepository.findOne({
      where: {
        user: { id: userId },
        entityType,
        entityId,
      },
      relations: ['user'],
    });
    return vote ? vote.value : null;
  }

  async getVoteCounts(entityType: VoteEntityType, entityId: number): Promise<VoteCountsDto> {
    let entity: Discussion | Comment | null = null;
    if (entityType === VoteEntityType.DISCUSSION) {
      entity = await this.discussionRepository.findOne({ where: { id: entityId } });
    } else {
      entity = await this.commentRepository.findOne({ where: { id: entityId } });
    }

    if (!entity) {
      throw new NotFoundException('Entity not found');
    }

    return {
      upvotes: entity.upvoteCount || 0,
      downvotes: entity.downvoteCount || 0,
    };
  }

  async getVotersByEntity(entityType: VoteEntityType, entityId: number, value?: VoteValue): Promise<User[]> {
    const query = this.voteRepository
      .createQueryBuilder('vote')
      .innerJoinAndSelect('vote.user', 'user')
      .where('vote.entityType = :entityType', { entityType })
      .andWhere('vote.entityId = :entityId', { entityId });

    if (value !== undefined) {
      query.andWhere('vote.value = :value', { value });
    }

    const votes = await query.getMany();
    return votes.map((vote) => vote.user);
  }

  async getEntitiesVotedByUser(userId: number, entityType: VoteEntityType, value?: VoteValue): Promise<number[]> {
    const query = this.voteRepository
      .createQueryBuilder('vote')
      .select('vote.entityId')
      .where('vote.entityType = :entityType', { entityType })
      .andWhere('vote.user = :userId', { userId });

    if (value !== undefined) {
      query.andWhere('vote.value = :value', { value });
    }

    const votes = await query.getRawMany();
    return votes.map((v) => v.entityId);
  }

  private async createVoteNotification(
    entityType: VoteEntityType,
    entityId: number,
    voterId: number,
    recipientId: number,
    value: VoteValue,
  ): Promise<void> {
    // Only send notifications for upvotes, not downvotes
    if (value !== VoteValue.UPVOTE || voterId === recipientId) {
      return;
    }

    try {
      const notificationType =
        entityType === VoteEntityType.DISCUSSION ? NotificationType.DISCUSSION_UPVOTE : NotificationType.COMMENT_UPVOTE;

      const notificationEntityType =
        entityType === VoteEntityType.DISCUSSION ? NotificationEntityType.DISCUSSION : NotificationEntityType.COMMENT;

      // Check if a notification already exists for this voter on this content
      const existingNotification = await this.notificationService.findExistingNotification(
        recipientId,
        voterId,
        notificationType,
        notificationEntityType,
        entityId,
      );

      // If a notification already exists, don't create another one
      if (existingNotification) {
        console.log('Notification already exists for this vote, skipping');
        return;
      }

      // Get voter info
      const voter = await this.userService.findById(voterId);

      let notificationData = {};
      if (entityType === VoteEntityType.COMMENT) {
        const comment = await this.commentRepository.findOne({ where: { id: entityId } });
        if (comment) {
          notificationData = { discussionId: comment.discussionId };
        }
      } else {
        notificationData = { discussionId: entityId };
      }

      // Create notification
      const notification = await this.notificationService.createNotification(
        recipientId,
        voterId,
        notificationType,
        notificationEntityType,
        entityId,
        notificationData,
      );

      // Send real-time notification
      this.websocketGateway.sendNotification(recipientId, {
        id: notification.id,
        type: notification.type,
        entityType: notification.entityType,
        entityId: notification.entityId,
        data: notification.data,
        createdAt: notification.createdAt,
        actor: {
          id: voter.id,
          username: voter.username,
          fullName: voter.fullName,
          avatarUrl: voter.avatarUrl,
        },
      });
    } catch (error) {
      console.error('Error creating vote notification:', error);
      // Don't throw - notifications are non-critical
    }
  }

  formatVoteResponse(vote: Vote): VoteResponseDto {
    return {
      value: vote.value,
      entityType: vote.entityType,
      entityId: vote.entityId,
      userId: vote.user.id,
      createdAt: vote.createdAt,
      updatedAt: vote.updatedAt,
    };
  }
}
