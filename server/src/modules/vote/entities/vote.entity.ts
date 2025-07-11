import { BeforeInsert, BeforeUpdate, Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseEntity } from '../../../core/database/entities/base.entity';
import { User } from '../../user/entities/user.entity';

/**
 * Vote entity type enumeration
 * Defines the types of entities that can be voted on
 */
export enum VoteEntityType {
  DISCUSSION = 'discussion',
  COMMENT = 'comment',
}

/**
 * Vote value enumeration
 * Defines the possible vote values
 */
export enum VoteValue {
  UPVOTE = 1,
  DOWNVOTE = -1,
}

/**
 * Vote entity representing user votes on discussions and comments
 *
 * @entity votes
 */
@Entity('votes')
@Index('idx_vote_entity', ['entityType', 'entityId'])
@Index('idx_vote_user', ['userId'])
@Index('idx_vote_value', ['value'])
@Index('idx_vote_created', ['createdAt'])
@Unique('uq_vote_user_entity', ['userId', 'entityType', 'entityId'])
export class Vote extends BaseEntity {
  @Column({
    name: 'entity_type',
    type: 'enum',
    enum: VoteEntityType,
    comment: 'Type of entity being voted on (discussion or comment)',
  })
  entityType: VoteEntityType;

  @Column({
    name: 'entity_id',
    type: 'integer',
    comment: 'ID of the entity being voted on',
  })
  entityId: number;

  @Column({
    type: 'integer',
    comment: 'Vote value: 1 for upvote, -1 for downvote',
  })
  value: VoteValue;

  @Column({
    name: 'user_id',
    type: 'integer',
    comment: 'ID of the user who cast the vote',
  })
  userId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  /**
   * Check if this is an upvote
   */
  isUpvote(): boolean {
    return this.value === VoteValue.UPVOTE;
  }

  /**
   * Check if this is a downvote
   */
  isDownvote(): boolean {
    return this.value === VoteValue.DOWNVOTE;
  }

  /**
   * Check if this vote is for a discussion
   */
  isDiscussionVote(): boolean {
    return this.entityType === VoteEntityType.DISCUSSION;
  }

  /**
   * Check if this vote is for a comment
   */
  isCommentVote(): boolean {
    return this.entityType === VoteEntityType.COMMENT;
  }

  /**
   * Toggle vote value (upvote ↔ downvote)
   */
  toggleVote(): void {
    this.value = this.value === VoteValue.UPVOTE ? VoteValue.DOWNVOTE : VoteValue.UPVOTE;
  }

  /**
   * Get vote description for logging/display
   */
  getVoteDescription(): string {
    const voteType = this.isUpvote() ? 'upvote' : 'downvote';
    return `${voteType} on ${this.entityType} ${this.entityId}`;
  }

  /**
   * Check if the vote is recent (within last 24 hours)
   */
  isRecentVote(): boolean {
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
    return this.createdAt > twentyFourHoursAgo;
  }

  /**
   * Get the opposite vote value
   */
  static getOppositeVote(value: VoteValue): VoteValue {
    return value === VoteValue.UPVOTE ? VoteValue.DOWNVOTE : VoteValue.UPVOTE;
  }
}
