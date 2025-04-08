import { Column, Entity, Index, JoinColumn, JoinTable, ManyToMany, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../core/database/entities/base.entity';
import { Faculty } from '../../academic/entity/faculty.entity';
import { StudyProgram } from '../../academic/entity/study-program.entity';
import { User } from '../../user/entities/user.entity';
import { Discussion } from './discussion.entity';

export enum SpaceType {
  ACADEMIC = 'academic',
  FACULTY = 'faculty',
  STUDY_PROGRAM = 'study_program',
  ORGANIZATION = 'organization',
  CAMPUS = 'campus',
  OTHER = 'other',
}

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

  @Column({ name: 'space_type', type: 'enum', enum: SpaceType, default: SpaceType.OTHER })
  spaceType: SpaceType;

  @Column({ name: 'faculty_id', nullable: true })
  facultyId: number | null;

  @ManyToOne(() => Faculty, (faculty) => faculty.spaces, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'faculty_id' })
  faculty: Faculty | null;

  @Column({ name: 'study_program_id', nullable: true })
  studyProgramId: number | null;

  @ManyToOne(() => StudyProgram, (studyProgram) => studyProgram.spaces, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'study_program_id' })
  studyProgram: StudyProgram | null;

  @OneToMany(() => Discussion, (discussion) => discussion.space)
  discussions: Discussion[];

  @Column({ name: 'icon_url', type: 'varchar', length: 255, nullable: true })
  iconUrl: string | null;

  @Column({ name: 'banner_url', type: 'varchar', length: 255, nullable: true })
  bannerUrl: string | null;

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
