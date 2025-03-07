import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vote, VoteEntityType, VoteValue } from './entities/vote.entity';
import { Discussion } from '../discussion/entities/discussion.entity';
import { Comment } from '../comment/entities/comment.entity';
import { User } from '../user/entities/user.entity';
import { VoteCountsDto, VoteResponseDto } from './dto/vote-response.dto';

@Injectable()
export class VoteService {
  constructor(
    @InjectRepository(Vote)
    private readonly voteRepository: Repository<Vote>,
    @InjectRepository(Discussion)
    private readonly discussionRepository: Repository<Discussion>,
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
  ) {}

  async voteDiscussion(userId: number, discussionId: number, value: VoteValue): Promise<VoteResponseDto | null> {
    const queryRunner = this.discussionRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const discussion = await queryRunner.manager.findOne(Discussion, { where: { id: discussionId } });
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
            discussion.upvoteCount += 1;
            discussion.downvoteCount -= 1;
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
        } else {
          discussion.downvoteCount += 1;
        }
      }

      // Ensure counts are never negative
      discussion.upvoteCount = Math.max(0, discussion.upvoteCount);
      discussion.downvoteCount = Math.max(0, discussion.downvoteCount);

      await queryRunner.manager.save(Discussion, discussion);
      await queryRunner.commitTransaction();

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
      const comment = await queryRunner.manager.findOne(Comment, {
        where: { id: commentId },
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
        } else {
          comment.downvoteCount += 1;
        }
      }

      // Ensure counts are never negative
      comment.upvoteCount = Math.max(0, comment.upvoteCount);
      comment.downvoteCount = Math.max(0, comment.downvoteCount);

      await queryRunner.manager.save(Comment, comment);
      await queryRunner.commitTransaction();

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
