import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../core/database/entities/base.entity';
import { User } from '../../user/entities/user.entity';

/**
 * Bug report priority levels
 */
export enum BugPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Bug report status
 */
export enum BugStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

/**
 * Bug Report entity representing bug reports in the system
 *
 * @entity bug_reports
 */
@Entity('bug_reports')
@Index('idx_bug_report_status', ['status'])
@Index('idx_bug_report_priority', ['priority'])
@Index('idx_bug_report_reporter', ['reporterId'])
export class BugReport extends BaseEntity {
  @Column({
    type: 'varchar',
    length: 255,
    comment: 'Bug report title',
  })
  title: string;

  @Column({
    type: 'text',
    comment: 'Detailed description of the bug',
  })
  description: string;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Steps to reproduce the bug',
  })
  stepsToReproduce: string | null;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: 'Browser/Platform where bug occurred',
  })
  environment: string | null;

  @Column({
    type: 'enum',
    enum: BugPriority,
    default: BugPriority.MEDIUM,
    comment: 'Priority level of the bug',
  })
  priority: BugPriority;

  @Column({
    type: 'enum',
    enum: BugStatus,
    default: BugStatus.OPEN,
    comment: 'Current status of the bug report',
  })
  status: BugStatus;

  @Column({
    name: 'reporter_id',
    type: 'int',
    comment: 'ID of the user who reported the bug',
  })
  reporterId: number;

  @Column({
    name: 'assigned_to_id',
    type: 'int',
    nullable: true,
    comment: 'ID of the user assigned to fix the bug',
  })
  assignedToId: number | null;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Resolution notes or comments',
  })
  resolution: string | null;

  // Relations
  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'reporter_id' })
  reporter: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assigned_to_id' })
  assignedTo: User | null;
}
