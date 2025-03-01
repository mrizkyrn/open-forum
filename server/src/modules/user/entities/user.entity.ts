import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../core/database/entities/base.entity';
import { UserRole } from '../../../common/enums/user-role.enum';

@Entity('users')
export class User extends BaseEntity {
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 100, unique: true })
  username: string;

  @Column({ type: 'varchar', length: 100, select: false })
  password: string;

  @Column({ name: 'full_name', type: 'varchar', length: 100 })
  fullName: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.STUDENT })
  role: UserRole;
}
