import { Column, Entity, JoinColumn, ManyToOne, Index } from 'typeorm';
import { BaseEntity } from '../../../core/database/entities/base.entity';
import { User } from '../../user/entities/user.entity';

export enum NotificationType {
  COMMENT_ON_DISCUSSION = 'comment_on_discussion',
  REPLY_TO_COMMENT = 'reply_to_comment',
  MENTION = 'mention',
  REPORT_STATUS_UPDATE = 'report_status_update',
  SPACE_FOLLOW = 'space_follow',
  CONTENT_MODERATION = 'content_moderation',
  DISCUSSION_UPVOTE = 'discussion_upvote',
  COMMENT_UPVOTE = 'comment_upvote',
}

export enum NotificationEntityType {
  DISCUSSION = 'discussion',
  COMMENT = 'comment',
  REPORT = 'report',
  DISCUSSION_SPACE = 'discussion_space',
  USER = 'user',
}

@Entity('notifications')
@Index(['recipientId'])
export class Notification extends BaseEntity {
  @Column({ name: 'recipient_id' })
  recipientId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'recipient_id' })
  recipient: User;

  @Column({ name: 'actor_id', nullable: true })
  actorId: number | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'actor_id' })
  actor: User;

  @Column({ type: 'enum', enum: NotificationType })
  type: NotificationType;

  @Column({ name: 'entity_type', type: 'enum', enum: NotificationEntityType })
  entityType: NotificationEntityType;

  @Column({ name: 'entity_id' })
  entityId: number;
  
  @Column({ type: 'jsonb', default: '{}' })
  data: Record<string, any>;

  @Column({ name: 'is_read', type: 'boolean', default: false })
  isRead: boolean;
}
