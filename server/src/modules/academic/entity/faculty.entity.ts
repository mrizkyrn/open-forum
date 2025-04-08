import { Column, Entity, Index, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../core/database/entities/base.entity';
import { DiscussionSpace } from '../../../modules/discussion/entities/discussion-space.entity';
import { StudyProgram } from './study-program.entity';

@Entity('faculties')
export class Faculty extends BaseEntity {
  @Column({ name: 'faculty_code', type: 'varchar', length: 20, unique: true })
  @Index()
  facultyCode: string;

  @Column({ name: 'faculty_name', type: 'varchar', length: 200 })
  facultyName: string;

  @Column({ name: 'faculty_abbreviation', type: 'varchar', length: 20 })
  facultyAbbreviation: string;

  @Column({ name: 'dean_name', type: 'varchar', length: 200, nullable: true })
  deanName: string;

  @Column({ name: 'vice_dean_1_name', type: 'varchar', length: 200, nullable: true })
  viceDean1Name: string;

  @Column({ name: 'vice_dean_2_name', type: 'varchar', length: 200, nullable: true })
  viceDean2Name: string;

  @Column({ name: 'vice_dean_3_name', type: 'varchar', length: 200, nullable: true })
  viceDean3Name: string;

  @OneToMany(() => StudyProgram, (studyProgram) => studyProgram.faculty)
  studyPrograms: StudyProgram[];

  @OneToMany(() => DiscussionSpace, (space) => space.faculty)
  spaces: DiscussionSpace[];
}
