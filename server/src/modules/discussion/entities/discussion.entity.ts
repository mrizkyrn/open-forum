import { BeforeInsert, BeforeUpdate, Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../core/database/entities/base.entity';
import { Attachment } from '../../attachment/entities/attachment.entity';
import { Comment } from '../../comment/entities/comment.entity';
import { User } from '../../user/entities/user.entity';
import { DiscussionSpace } from './discussion-space.entity';

/**
 * Discussion entity representing forum discussions
 *
 * @entity discussions
 */
@Entity('discussions')
@Index('idx_discussion_author', ['authorId'])
@Index('idx_discussion_space', ['spaceId'])
@Index('idx_discussion_tags', ['tags'])
@Index('idx_discussion_is_anonymous', ['isAnonymous'])
@Index('idx_discussion_is_edited', ['isEdited'])
export class Discussion extends BaseEntity {
  @Column({ type: 'text', comment: 'Main content of the discussion' })
  content: string;

  @Column({ name: 'is_anonymous', type: 'boolean', default: false, comment: 'Whether the author is anonymous' })
  isAnonymous: boolean;

  @Column({ name: 'author_id', type: 'integer', comment: 'ID of the author' })
  authorId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'author_id' })
  author: User;

  @OneToMany(() => Comment, (comment) => comment.discussion)
  comments: Comment[];

  @Column({ name: 'comment_count', type: 'integer', default: 0, comment: 'Number of comments' })
  commentCount: number;

  @Column({ name: 'upvote_count', type: 'integer', default: 0, comment: 'Number of upvotes' })
  upvoteCount: number;

  @Column({ name: 'downvote_count', type: 'integer', default: 0, comment: 'Number of downvotes' })
  downvoteCount: number;

  @Column({ type: 'text', array: true, nullable: true, default: '{}', comment: 'Tags/categories for the discussion' })
  tags: string[];

  @OneToMany(() => Attachment, (attachment) => attachment.entityId)
  attachments: Attachment[];

  @Column({ name: 'space_id', type: 'integer', nullable: true, comment: 'ID of the space this discussion belongs to' })
  spaceId: number;

  @ManyToOne(() => DiscussionSpace, (space) => space.discussions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'space_id' })
  space: DiscussionSpace;

  @Column({ name: 'is_edited', type: 'boolean', default: false, comment: 'Whether the discussion has been edited' })
  isEdited: boolean;

  /**
   * Check if discussion is anonymous
   */
  isAnonymousAuthor(): boolean {
    return this.isAnonymous === true;
  }

  /**
   * Check if discussion has tags
   */
  hasTags(): boolean {
    return Array.isArray(this.tags) && this.tags.length > 0;
  }

  /**
   * Mark discussion as edited
   */
  markEdited(): void {
    this.isEdited = true;
  }
}
