import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseEntity } from '../../../core/database/entities/base.entity';
import { Discussion } from '../../discussion/entities/discussion.entity';
import { User } from '../../user/entities/user.entity';

@Entity('bookmarks')
@Unique(['userId', 'discussionId'])
export class Bookmark extends BaseEntity {
  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'discussion_id' })
  discussionId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Discussion, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'discussion_id' })
  discussion: Discussion;
}
