import { Column, Entity, Index, JoinTable, ManyToMany, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../core/database/entities/base.entity';
import { User } from '../../user/entities/user.entity';
import { Discussion } from './discussion.entity';

@Entity('discussion_spaces')
export class DiscussionSpace extends BaseEntity {
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  @Index()
  slug: string;

  @Column({ name: 'creator_id' })
  creatorId: number;

  @OneToMany(() => Discussion, (discussion) => discussion.space)
  discussions: Discussion[];

  @Column({ name: 'icon_url', type: 'varchar', length: 255, nullable: true })
  iconUrl: string;

  @Column({ name: 'banner_url', type: 'varchar', length: 255, nullable: true })
  bannerUrl: string;

  @Column({ name: 'follower_count', type: 'integer', default: 0 })
  followerCount: number;

  @ManyToMany(() => User)
  @JoinTable({
    name: 'discussion_space_followers',
    joinColumn: { name: 'space_id' },
    inverseJoinColumn: { name: 'user_id' },
  })
  followers: User[];
}
