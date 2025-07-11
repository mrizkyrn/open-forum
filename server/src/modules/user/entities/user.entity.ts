import { BeforeInsert, BeforeUpdate, Column, Entity, Index } from 'typeorm';
import { UserRole } from '../../../common/enums/user-role.enum';
import { BaseEntity } from '../../../core/database/entities/base.entity';

/**
 * User entity representing users in the system
 *
 * @entity users
 */
@Entity('users')
@Index('idx_user_email', ['email'])
@Index('idx_user_username', ['username'])
@Index('idx_user_role', ['role'])
@Index('idx_user_last_active', ['lastActiveAt'])
@Index('idx_user_oauth_provider', ['oauthProvider'])
export class User extends BaseEntity {
  @Column({
    type: 'varchar',
    length: 100,
    unique: true,
    nullable: true,
    comment: 'User email address - unique and optional',
  })
  email: string | null;

  @Column({
    type: 'varchar',
    length: 25,
    unique: true,
    comment: 'Unique username for login',
  })
  username: string;

  @Column({
    type: 'varchar',
    length: 255,
    select: false,
    nullable: true,
    comment: 'Hashed password - excluded from default selects',
  })
  password: string | null;

  @Column({
    name: 'full_name',
    type: 'varchar',
    length: 100,
    comment: 'User full name',
  })
  fullName: string;

  @Column({
    name: 'avatar_url',
    type: 'varchar',
    length: 500,
    nullable: true,
    comment: 'URL to user avatar image',
  })
  avatarUrl: string | null;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
    comment: 'User role in the system',
  })
  role: UserRole;

  @Column({
    name: 'last_active_at',
    type: 'timestamp',
    nullable: true,
    comment: 'Last time user was active in the system',
  })
  lastActiveAt: Date | null;

  @Column({
    name: 'oauth_provider',
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: 'OAuth provider used for authentication (google, github, etc.)',
  })
  oauthProvider: string | null;

  /**
   * Normalize data before insertion
   */
  @BeforeInsert()
  normalizeDataBeforeInsert(): void {
    this.normalizeData();
  }

  /**
   * Normalize data before update
   */
  @BeforeUpdate()
  normalizeDataBeforeUpdate(): void {
    this.normalizeData();
  }

  /**
   * Normalize username and email to lowercase
   */
  private normalizeData(): void {
    if (this.email) {
      this.email = this.email.toLowerCase().trim();
    }
    if (this.username) {
      this.username = this.username.toLowerCase().trim();
    }
    if (this.fullName) {
      this.fullName = this.fullName.trim();
    }
  }

  /**
   * Check if user has admin role
   */
  isAdmin(): boolean {
    return this.role === UserRole.ADMIN;
  }

  /**
   * Check if user was recently active (within last 30 days)
   */
  isRecentlyActive(): boolean {
    if (!this.lastActiveAt) return false;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return this.lastActiveAt > thirtyDaysAgo;
  }

  /**
   * Update last active timestamp
   */
  updateLastActive(): void {
    this.lastActiveAt = new Date();
  }
}
