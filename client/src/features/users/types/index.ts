import { Faculty, StudyProgram } from '@/features/academic/types';
import { BaseQueryParams } from '@/shared/types/RequestTypes';

// ===== CORE ENTITIES =====

export interface User {
  id: number;
  username: string;
  fullName: string;
  gender: string;
  batchYear: string;
  role: UserRole;
  avatarUrl?: string | null;
  lastActiveAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserDetail {
  id: number;
  username: string;
  fullName: string;
  gender: string;
  batchYear: string;
  educationLevel: string;
  studyProgram: StudyProgram;
  faculty: Faculty;
  email: string;
  phone: string;
  role: UserRole;
  avatarUrl?: string | null;
  lastActiveAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ===== REQUEST TYPES =====

export interface CreateUserRequest {
  username: string;
  password: string;
  fullName: string;
  role: UserRole;
}

export interface UpdateUserRequest {
  fullName?: string;
  role?: UserRole;
}

// ===== QUERY PARAMETERS =====

export interface SearchUserParams extends BaseQueryParams {
  role?: UserRole;
  sortBy?: UserSortBy;
}

// ===== ENUMS =====

export enum UserRole {
  ADMIN = 'admin',
  STUDENT = 'student',
  LECTURER = 'lecturer',
}

export enum UserSortBy {
  createdAt = 'createdAt',
  updatedAt = 'updatedAt',
  username = 'username',
  fullName = 'fullName',
  role = 'role',
  lastActiveAt = 'lastActiveAt',
}

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}
