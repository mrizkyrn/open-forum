import { Entity, Column, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { BaseEntity } from '../../../core/database/entities/base.entity';

export enum VoteEntityType {
  DISCUSSION = 'discussion',
  COMMENT = 'comment',
}

export enum VoteValue {
  UPVOTE = 1,
  DOWNVOTE = -1,
}

@Entity('votes')
export class Vote extends BaseEntity {
  @PrimaryColumn({ name: 'entity_type', type: 'enum', enum: VoteEntityType })
  entityType: VoteEntityType;

  @PrimaryColumn({ name: 'entity_id' })
  entityId: number;

  @Column({ type: 'integer' })
  value: VoteValue;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
