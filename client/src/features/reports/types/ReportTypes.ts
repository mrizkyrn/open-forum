import { User } from '@/features/users/types';

export enum ReportTargetType {
  DISCUSSION = 'discussion',
  COMMENT = 'comment',
}

export enum ReportStatus {
  PENDING = 'pending',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed'
}

export interface ReportReason {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Report {
  id: number;
  targetType: ReportTargetType;
  targetId: number;
  reasonId: number;
  description: string;
  createdAt: string;
  updatedAt: string;
  reporter: User;
  targetDetails: {
    content: string;
    author: User;
    createdAt: string;
    deleted: boolean;
  };
  reason: ReportReason;
  status: ReportStatus;
  reviewer: User | null;
  reviewedAt: string | null;
}
