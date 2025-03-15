import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../core/database/entities/base.entity';
import { User } from '../../user/entities/user.entity';
import { ReportReason } from './report-reason.entity';

export enum ReportStatus {
  PENDING = 'pending',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed',
}

export enum ReportTargetType {
  DISCUSSION = 'discussion',
  COMMENT = 'comment',
}

@Entity('reports')
@Index(['targetType', 'targetId'])
export class Report extends BaseEntity {
  @Column({ name: 'reporter_id' })
  reporterId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reporter_id' })
  reporter: User;

  @Column({ name: 'target_type', type: 'enum', enum: ReportTargetType })
  targetType: ReportTargetType;

  @Column({ name: 'target_id' })
  targetId: number;

  @Column({ name: 'reason_id' })
  reasonId: number;

  @ManyToOne(() => ReportReason, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reason_id' })
  reason: ReportReason;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: ReportStatus,
    default: ReportStatus.PENDING,
  })
  status: ReportStatus;

  @Column({ name: 'reviewer_id', nullable: true })
  reviewerId: number | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'reviewer_id' })
  reviewer: User;

  @Column({ name: 'reviewed_at', type: 'timestamp', nullable: true })
  reviewedAt: Date | null;
}
