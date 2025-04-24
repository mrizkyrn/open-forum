import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../core/database/entities/base.entity';
import { User } from '../../user/entities/user.entity';

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
  @Column({ name: 'entity_type', type: 'enum', enum: VoteEntityType })
  entityType: VoteEntityType;

  @Column({ name: 'entity_id' })
  entityId: number;

  @Column({ type: 'integer' })
  value: VoteValue;

  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
