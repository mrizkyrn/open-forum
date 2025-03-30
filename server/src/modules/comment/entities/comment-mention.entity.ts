import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../core/database/entities/base.entity';
import { User } from '../../user/entities/user.entity';
import { Comment } from './comment.entity';

@Entity('comment_mentions')
export class CommentMention extends BaseEntity {
  @Column({ name: 'comment_id' })
  commentId: number;

  @ManyToOne(() => Comment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'comment_id' })
  comment: Comment;

  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
