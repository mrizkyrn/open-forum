import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../core/database/entities/base.entity';
import { DiscussionSpace } from '../../../modules/discussion/entities/discussion-space.entity';
import { User } from '../../user/entities/user.entity';
import { Faculty } from './faculty.entity';

@Entity('study_programs')
export class StudyProgram extends BaseEntity {
  @Column({ name: 'study_program_code', type: 'varchar', length: 20 })
  @Index()
  studyProgramCode: string;

  @Column({ name: 'education_level', type: 'varchar', length: 50, nullable: true })
  educationLevel: string;

  @Column({ name: 'study_program_name', type: 'varchar', length: 200 })
  studyProgramName: string;

  @Column({ name: 'faculty_id' })
  facultyId: number;

  @ManyToOne(() => Faculty, (faculty) => faculty.studyPrograms, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'faculty_id' })
  faculty: Faculty;

  @Column({ name: 'director_name', type: 'varchar', length: 200, nullable: true })
  directorName: string;

  @OneToMany(() => User, (user) => user.studyProgram)
  students: User[];

  @OneToMany(() => DiscussionSpace, (space) => space.studyProgram)
  spaces: DiscussionSpace[];
}
