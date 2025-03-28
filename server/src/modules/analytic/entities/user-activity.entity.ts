import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../core/database/entities/base.entity';
import { User } from '../../user/entities/user.entity';

export enum ActivityType {
  CREATE_DISCUSSION = 'create_discussion',
  CREATE_COMMENT = 'create_comment',
  VOTE_DISCUSSION = 'vote_discussion',
  VOTE_COMMENT = 'vote_comment',
  BOOKMARK_DISCUSSION = 'bookmark_discussion',
  REMOVE_BOOKMARK = 'remove_bookmark',
  FOLLOW_SPACE = 'follow_space',
  UNFOLLOW_SPACE = 'unfollow_space',
  REPORT_CONTENT = 'report_content',
  EDIT_DISCUSSION = 'edit_discussion',
  EDIT_COMMENT = 'edit_comment',
  DELETE_DISCUSSION = 'delete_discussion',
  DELETE_COMMENT = 'delete_comment',
}

export enum ActivityEntityType {
  DISCUSSION = 'discussion',
  COMMENT = 'comment',
  DISCUSSION_SPACE = 'discussion_space',
  REPORT = 'report',
  USER = 'user',
}

@Entity('user_activities')
@Index(['userId', 'createdAt'])
@Index(['entityType', 'entityId'])
export class UserActivity extends BaseEntity {
  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'enum', enum: ActivityType })
  type: ActivityType;

  @Column({ name: 'entity_type', type: 'enum', enum: ActivityEntityType })
  entityType: ActivityEntityType;

  @Column({ name: 'entity_id' })
  entityId: number;

  @Column({ type: 'jsonb', default: '{}' })
  metadata: Record<string, any>;

  @Column({ name: 'ip_address', type: 'varchar', length: 45, nullable: true })
  ipAddress: string | null;

  @Column({ name: 'user_agent', type: 'varchar', length: 255, nullable: true })
  userAgent: string | null;
}
