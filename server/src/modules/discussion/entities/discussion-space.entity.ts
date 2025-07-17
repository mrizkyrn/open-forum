import { BeforeInsert, BeforeUpdate, Column, Entity, Index, JoinTable, ManyToMany, OneToMany } from 'typeorm';

/**
 * DiscussionSpace entity representing forum spaces
 *
 * @entity discussion_spaces
 */
import { BaseEntity } from '../../../core/database/entities/base.entity';
import { User } from '../../user/entities/user.entity';
import { Discussion } from './discussion.entity';

/**
 * Common space types for public use
 */
export enum SpaceType {
  GENERAL = 'general',
  INTEREST = 'interest',
  PROFESSIONAL = 'professional',
  COMMUNITY = 'community',
  ORGANIZATION = 'organization',
  EVENT = 'event',
  SUPPORT = 'support',
  OTHER = 'other',
}

@Entity('discussion_spaces')
@Index('idx_space_slug', ['slug'], { unique: true })
@Index('idx_space_creator', ['creatorId'])
@Index('idx_space_type', ['spaceType'])
@Index('idx_space_follower_count', ['followerCount'])
export class DiscussionSpace extends BaseEntity {
  @Column({ type: 'varchar', length: 100, comment: 'Name of the space' })
  name: string;

  @Column({ type: 'text', nullable: true, comment: 'Description of the space' })
  description: string;

  @Column({ type: 'varchar', length: 100, unique: true, comment: 'Unique slug for the space' })
  slug: string;

  @Column({ name: 'creator_id', type: 'integer', comment: 'ID of the creator' })
  creatorId: number;

  @Column({ name: 'space_type', type: 'enum', enum: SpaceType, default: SpaceType.OTHER, comment: 'Type of the space' })
  spaceType: SpaceType;

  @OneToMany(() => Discussion, (discussion) => discussion.space)
  discussions: Discussion[];

  @Column({ name: 'icon_url', type: 'varchar', length: 255, nullable: true, comment: 'Icon URL for the space' })
  iconUrl: string | null;

  @Column({ name: 'banner_url', type: 'varchar', length: 255, nullable: true, comment: 'Banner URL for the space' })
  bannerUrl: string | null;

  @Column({ name: 'follower_count', type: 'integer', default: 0, comment: 'Number of followers' })
  followerCount: number;

  @ManyToMany(() => User)
  @JoinTable({
    name: 'discussion_space_followers',
    joinColumn: { name: 'space_id' },
    inverseJoinColumn: { name: 'user_id' },
  })
  followers: User[];

  /**
   * Normalize data before insert
   */
  @BeforeInsert()
  normalizeBeforeInsert(): void {
    this.normalizeData();
  }

  /**
   * Normalize data before update
   */
  @BeforeUpdate()
  normalizeBeforeUpdate(): void {
    this.normalizeData();
  }

  /**
   * Normalize slug and name
   */
  private normalizeData(): void {
    if (this.slug) {
      this.slug = this.slug.toLowerCase().trim();
    }
  }

  /**
   * Check if space has a banner
   */
  hasBanner(): boolean {
    return !!this.bannerUrl;
  }

  /**
   * Check if space has an icon
   */
  hasIcon(): boolean {
    return !!this.iconUrl;
  }

  /**
   * Check if space is general type
   */
  isGeneralSpace(): boolean {
    return this.spaceType === SpaceType.GENERAL;
  }
}
