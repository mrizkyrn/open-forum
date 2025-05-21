import { User } from '@/features/users/types';
import { SearchDto } from '@/types/SearchTypes';

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
    discussionId?: number;
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

export interface CretaReportDto {
  targetType: ReportTargetType;
  targetId: number;
  reasonId: number;
  description?: string;
}

export enum ReportTargetType {
  DISCUSSION = 'discussion',
  COMMENT = 'comment',
}

export enum ReportStatus {
  PENDING = 'pending',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed',
}

export interface ReportReason {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export enum ReportSortBy {
  createdAt = 'createdAt',
  updatedAt = 'updatedAt',
  reviewedAt = 'reviewedAt',
}

export interface SearchReportDto extends SearchDto {
  status?: ReportStatus;
  targetType?: ReportTargetType;
  sortBy?: ReportSortBy;
}