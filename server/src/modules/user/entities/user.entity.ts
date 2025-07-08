import { Column, Entity, Index } from 'typeorm';
import { UserRole } from '../../../common/enums/user-role.enum';
import { BaseEntity } from '../../../core/database/entities/base.entity';

@Entity('users')
export class User extends BaseEntity {
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 100, unique: true, nullable: true })
  email: string | null;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 100, unique: true })
  username: string;

  @Column({ type: 'varchar', length: 100, select: false, nullable: true })
  password: string | null;

  @Column({ name: 'full_name', type: 'varchar', length: 100 })
  fullName: string;

  @Column({ name: 'avatar_url', type: 'varchar', length: 255, nullable: true })
  avatarUrl: string | null;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.STUDENT })
  role: UserRole;

  @Column({ name: 'last_active_at', type: 'timestamp', nullable: true })
  lastActiveAt: Date | null;

  @Column({ name: 'oauth_provider', type: 'varchar', length: 50, nullable: true })
  oauthProvider: string | null;
}
