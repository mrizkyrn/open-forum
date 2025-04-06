import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { UserRole } from '../../../common/enums/user-role.enum';
import { BaseEntity } from '../../../core/database/entities/base.entity';
import { StudyProgram } from '../../academic/entity/study-program.entity';

@Entity('users')
export class User extends BaseEntity {
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 100, unique: true })
  username: string;

  @Column({ type: 'varchar', length: 100, select: false, nullable: true })
  password: string | null;

  @Column({ name: 'full_name', type: 'varchar', length: 100 })
  fullName: string;

  @Column({ type: 'varchar', length: 1, nullable: true })
  gender: string | null;

  @Column({ name: 'batch_year', type: 'varchar', length: 4, nullable: true })
  batchYear: string | null;

  @Column({ name: 'education_level', type: 'varchar', length: 10, nullable: true })
  educationLevel: string | null;

  @Column({ name: 'study_program_id', nullable: true })
  studyProgramId: number | null;

  @ManyToOne(() => StudyProgram, (studyProgram) => studyProgram.students, { nullable: true })
  @JoinColumn({ name: 'study_program_id' })
  studyProgram: StudyProgram | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  email: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string | null;

  @Column({ name: 'avatar_url', type: 'varchar', length: 255, nullable: true })
  avatarUrl: string | null;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.STUDENT })
  role: UserRole;

  @Column({ name: 'last_active_at', type: 'timestamp', nullable: true })
  lastActiveAt: Date | null;

  @Column({ name: 'is_external', type: 'boolean', default: false })
  isExternalUser: boolean;
}
