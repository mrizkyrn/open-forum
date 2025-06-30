import { User } from '@/features/users/types';
import { BaseQueryParams } from '@/shared/types/RequestTypes';

// ===== CORE ENTITIES =====

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

export interface ReportReason {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ===== REQUEST TYPES =====

export interface CreateReportRequest {
  targetType: ReportTargetType;
  targetId: number;
  reasonId: number;
  description?: string;
}

export interface HandleReportRequest {
  status: ReportStatus;
  deleteContent: boolean;
  note?: string;
  notifyReporter?: boolean;
  notifyAuthor?: boolean;
}

// ===== RESPONSE TYPES =====

export interface ReportStatsResponse {
  total: number;
  pending: number;
  resolved: number;
  dismissed: number;
}

// ===== QUERY PARAMETERS =====

export interface ReportQueryParams extends BaseQueryParams {
  status?: ReportStatus;
  targetType?: ReportTargetType;
  sortBy?: ReportSortBy;
}

// ===== ENUMS =====

export enum ReportTargetType {
  DISCUSSION = 'discussion',
  COMMENT = 'comment',
}

export enum ReportStatus {
  PENDING = 'pending',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed',
}

export enum ReportSortBy {
  createdAt = 'createdAt',
  updatedAt = 'updatedAt',
  reviewedAt = 'reviewedAt',
}
