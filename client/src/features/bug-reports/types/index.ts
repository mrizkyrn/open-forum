import { User } from '@/features/users/types';
import { BaseQueryParams } from '@/shared/types/RequestTypes';

// ===== CORE ENTITIES =====

export interface BugReport {
  id: number;
  title: string;
  description: string;
  status: BugStatus;
  priority: BugPriority;
  reporterId: number;
  assignedToId?: number | null;
  resolution?: string | null;
  createdAt: string;
  updatedAt: string;
  reporter: User;
  assignedTo?: User | null;
}

// ===== REQUEST TYPES =====

export interface CreateBugReportRequest {
  title: string;
  description: string;
  priority: BugPriority;
}

export interface UpdateBugReportRequest {
  title?: string;
  description?: string;
  priority?: BugPriority;
  status?: BugStatus;
  resolution?: string;
}

export interface AssignBugReportRequest {
  assignedToId: number | null;
}

export interface UpdateBugReportStatusRequest {
  status: BugStatus;
  resolution?: string;
}

// ===== QUERY PARAMETERS =====

export interface BugReportQueryParams extends BaseQueryParams {
  status?: BugStatus;
  priority?: BugPriority;
  reporterId?: number;
  assignedToId?: number;
  sortBy?: BugReportSortBy;
}

// ===== ENUMS =====

export enum BugStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

export enum BugPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum BugReportSortBy {
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  TITLE = 'title',
  STATUS = 'status',
  PRIORITY = 'priority',
}

// ===== STATUS DISPLAY =====

export const BugStatusDisplay = {
  [BugStatus.OPEN]: { label: 'Open', color: 'bg-blue-100 text-blue-800' },
  [BugStatus.IN_PROGRESS]: { label: 'In Progress', color: 'bg-yellow-100 text-yellow-800' },
  [BugStatus.RESOLVED]: { label: 'Resolved', color: 'bg-green-100 text-green-800' },
  [BugStatus.CLOSED]: { label: 'Closed', color: 'bg-gray-100 text-gray-800' },
};

export const BugPriorityDisplay = {
  [BugPriority.LOW]: { label: 'Low', color: 'bg-gray-100 text-gray-800' },
  [BugPriority.MEDIUM]: { label: 'Medium', color: 'bg-blue-100 text-blue-800' },
  [BugPriority.HIGH]: { label: 'High', color: 'bg-orange-100 text-orange-800' },
  [BugPriority.CRITICAL]: { label: 'Critical', color: 'bg-red-100 text-red-800' },
};
