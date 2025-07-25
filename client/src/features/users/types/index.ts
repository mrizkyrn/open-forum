import { BaseQueryParams } from '@/shared/types/RequestTypes';

// ===== CORE ENTITIES =====

export interface User {
  id: number;
  email?: string | null;
  username: string;
  fullName: string;
  role: UserRole;
  avatarUrl?: string | null;
  lastActiveAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserDetail {
  id: number;
  email: string;
  username: string;
  fullName: string;
  role: UserRole;
  avatarUrl?: string | null;
  oauthProvider?: string | null;
  lastActiveAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ===== REQUEST TYPES =====

export interface CreateUserRequest {
  email?: string;
  username: string;
  fullName: string;
  password: string;
  role?: UserRole;
}

export interface UpdateUserRequest {
  email?: string | null;
  fullName?: string;
  password?: string;
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
  USER = 'user',
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
