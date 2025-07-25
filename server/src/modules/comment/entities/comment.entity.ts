import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../core/database/entities/base.entity';
import { Attachment } from '../../attachment/entities/attachment.entity';
import { Discussion } from '../../discussion/entities/discussion.entity';
import { User } from '../../user/entities/user.entity';
import { CommentMention } from './comment-mention.entity';

@Entity('comments')
export class Comment extends BaseEntity {
  @Column({ type: 'text' })
  content: string;

  @Column({ name: 'author_id' })
  authorId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'author_id' })
  author: User;

  @Column({ name: 'is_edited', type: 'boolean', default: false })
  isEdited: boolean;

  @Column({ name: 'discussion_id' })
  discussionId: number;

  @ManyToOne(() => Discussion, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'discussion_id' })
  discussion: Discussion;

  @Column({ name: 'parent_id', nullable: true })
  @Index()
  parentId: number | null;

  @ManyToOne(() => Comment, (comment) => comment.replies, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'parent_id' })
  parent: Comment;

  @OneToMany(() => Comment, (comment) => comment.parent)
  replies: Comment[];

  @Column({ name: 'upvote_count', type: 'integer', default: 0 })
  upvoteCount: number;

  @Column({ name: 'downvote_count', type: 'integer', default: 0 })
  downvoteCount: number;

  @Column({ name: 'reply_count', type: 'integer', default: 0 })
  replyCount: number;

  @OneToMany(() => CommentMention, (mention) => mention.comment)
  mentions: CommentMention[];

  attachments: Attachment[];
}
