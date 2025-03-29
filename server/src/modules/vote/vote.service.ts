import { forwardRef, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RedisChannels } from 'src/core/redis/redis.constants';
import { RedisService } from 'src/core/redis/redis.service';
import { Between, Repository } from 'typeorm';
import { CommentService } from '../comment/comment.service';
import { Comment } from '../comment/entities/comment.entity';
import { DiscussionService } from '../discussion/discussion.service';
import { Discussion } from '../discussion/entities/discussion.entity';
import { VoteDto } from './dto/vote-dto';
import { VoteCountsDto, VoteResponseDto } from './dto/vote-response.dto';
import { Vote, VoteEntityType, VoteValue } from './entities/vote.entity';

@Injectable()
export class VoteService {
  private readonly logger = new Logger(VoteService.name);

  constructor(
    @InjectRepository(Vote)
    private readonly voteRepository: Repository<Vote>,
    @Inject(forwardRef(() => DiscussionService))
    private readonly discussionService: DiscussionService,
    @Inject(forwardRef(() => CommentService))
    private readonly commentService: CommentService,
    private readonly redisService: RedisService,
  ) {}

  // ----- Core Vote Operations -----

  async voteDiscussion(userId: number, discussionId: number, voteDto: VoteDto): Promise<VoteResponseDto | null> {
    return this.voteEntity(userId, VoteEntityType.DISCUSSION, discussionId, voteDto.value, voteDto.clientRequestTime);
  }

  async voteComment(userId: number, commentId: number, voteDto: VoteDto): Promise<VoteResponseDto | null> {
    return this.voteEntity(userId, VoteEntityType.COMMENT, commentId, voteDto.value, voteDto.clientRequestTime);
  }

  async getUserVoteStatus(userId: number, entityType: VoteEntityType, entityId: number): Promise<number | null> {
    try {
      const vote = await this.voteRepository.findOne({
        where: {
          user: { id: userId },
          entityType,
          entityId,
        },
        relations: ['user'],
      });
      return vote ? vote.value : null;
    } catch (error) {
      this.logger.error(`Error getting user vote status: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getVoteCounts(entityType: VoteEntityType, entityId: number): Promise<VoteCountsDto> {
    try {
      let entity: Discussion | Comment | null = null;

      if (entityType === VoteEntityType.DISCUSSION) {
        entity = await this.discussionService.getDiscussionEntity(entityId);
      } else {
        entity = await this.commentService.getCommentEntity(entityId);
      }

      if (!entity) {
        throw new NotFoundException('Entity not found');
      }

      return {
        upvotes: entity.upvoteCount || 0,
        downvotes: entity.downvoteCount || 0,
      };
    } catch (error) {
      this.logger.error(`Error getting vote counts: ${error.message}`, error.stack);
      throw error;
    }
  }

  // ----- Other Operations -----

  async countByDateRange(start: Date, end: Date): Promise<number> {
    return this.voteRepository.count({
      where: { createdAt: Between(start, end) },
    });
  }

  async getTimeSeries(start: Date, end: Date): Promise<{ date: string; count: string }[]> {
    return this.voteRepository
      .createQueryBuilder('vote')
      .select(`DATE(vote.created_at)`, 'date')
      .addSelect(`COUNT(vote.id)`, 'count')
      .where('vote.created_at BETWEEN :start AND :end', {
        start,
        end,
      })
      .groupBy(`DATE(vote.created_at)`)
      .orderBy(`DATE(vote.created_at)`, 'ASC')
      .getRawMany();
  }

  // ----- Helper Methods -----

  private async voteEntity(
    userId: number,
    entityType: VoteEntityType,
    entityId: number,
    value: VoteValue,
    clientRequestTime?: number,
  ): Promise<VoteResponseDto | null> {
    const queryRunner = this.voteRepository.manager.connection.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      // Get entity and determine which service to use
      const service = entityType === VoteEntityType.DISCUSSION ? this.discussionService : this.commentService;

      // Get the entity (this validates it exists)
      const entity =
        entityType === VoteEntityType.DISCUSSION
          ? await this.discussionService.getDiscussionEntity(entityId)
          : await this.commentService.getCommentEntity(entityId);

      // Get the recipient ID for notification
      const recipientId = entity.authorId;

      // Determine parent entity info for analytics
      let discussionId = entityId;
      if (entityType === VoteEntityType.COMMENT) {
        discussionId = (entity as Comment).discussionId;
      }

      // Find existing vote within transaction
      const existingVote = await queryRunner.manager.findOne(Vote, {
        where: {
          user: { id: userId },
          entityType,
          entityId,
        },
        relations: ['user'],
      });

      let result: Vote | null = null;
      let shouldNotify = false;
      let voteAction: 'added' | 'removed' | 'changed' = 'added';
      let oldVoteValue: VoteValue | null = null;

      // Handle vote based on existing state
      if (existingVote) {
        oldVoteValue = existingVote.value;

        // If same vote exists, remove it (toggle behavior)
        if (existingVote.value === value) {
          await queryRunner.manager.remove(existingVote);
          voteAction = 'removed';

          // Update counts
          if (value === VoteValue.UPVOTE) {
            await service.decrementUpvoteCount(entityId, queryRunner.manager);
          } else {
            await service.decrementDownvoteCount(entityId, queryRunner.manager);
          }
        } else {
          // Change vote direction
          existingVote.value = value;
          result = await queryRunner.manager.save(Vote, existingVote);
          voteAction = 'changed';

          // Update counts
          if (value === VoteValue.UPVOTE) {
            await service.incrementUpvoteCount(entityId, queryRunner.manager);
            await service.decrementDownvoteCount(entityId, queryRunner.manager);
            shouldNotify = true;
          } else {
            await service.incrementDownvoteCount(entityId, queryRunner.manager);
            await service.decrementUpvoteCount(entityId, queryRunner.manager);
          }
        }
      } else {
        // Create new vote
        const vote = queryRunner.manager.create(Vote, {
          user: { id: userId },
          entityType,
          entityId,
          value,
        });

        result = await queryRunner.manager.save(Vote, vote);
        voteAction = 'added';

        // Update counts
        if (value === VoteValue.UPVOTE) {
          await service.incrementUpvoteCount(entityId, queryRunner.manager);
          shouldNotify = true;
        } else {
          await service.incrementDownvoteCount(entityId, queryRunner.manager);
        }
      }

      await queryRunner.commitTransaction();

      // Publish vote event to Redis
      await this.redisService.publish(RedisChannels.VOTE_UPDATED, {
        userId,
        recipientId,
        shouldNotify,
        entityType,
        entityId,
        voteAction,
        voteValue: value,
        discussionId,
        clientRequestTime,
      });

      return result ? VoteResponseDto.fromEntity(result) : null;
    } catch (error) {
      this.logger.error(`Error voting on ${entityType} ${entityId}: ${error.message}`, error.stack);
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
