import { Column, Entity, JoinColumn, ManyToOne, Index, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../core/database/entities/base.entity';
import { User } from '../../user/entities/user.entity';
import { Attachment } from '../../attachment/entities/attachment.entity';
import { Comment } from '../../comment/entities/comment.entity';
import { DiscussionSpace } from './discussion-space.entity';

@Entity('discussions')
export class Discussion extends BaseEntity {
  @Column({ type: 'text' })
  content: string;

  @Column({ name: 'is_anonymous', type: 'boolean', default: false })
  isAnonymous: boolean;

  @Column({ name: 'author_id' })
  authorId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'author_id' })
  author: User;

  @OneToMany(() => Comment, (comment) => comment.discussion)
  comments: Comment[];

  @Column({ name: 'comment_count', type: 'integer', default: 0 })
  commentCount: number;

  @Column({ name: 'upvote_count', type: 'integer', default: 0 })
  upvoteCount: number;

  @Column({ name: 'downvote_count', type: 'integer', default: 0 })
  downvoteCount: number;

  @Column({ type: 'text', array: true, nullable: true, default: '{}' })
  tags: string[];

  @OneToMany(() => Attachment, (attachment) => attachment.entityId)
  attachments: Attachment[];

  @Column({ name: 'space_id', nullable: true })
  spaceId: number;

  @ManyToOne(() => DiscussionSpace, (space) => space.discussions)
  @JoinColumn({ name: 'space_id' })
  space: DiscussionSpace;
}
