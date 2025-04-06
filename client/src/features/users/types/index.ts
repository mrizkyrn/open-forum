import { Faculty, StudyProgram } from '@/features/academic/types';

export enum UserRole {
  ADMIN = 'admin',
  STUDENT = 'student',
  LECTURER = 'lecturer',
}

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

export interface SearchUserParams {
  page: number;
  limit: number;
  search?: string;
  sortOrder?: SortOrder;
  role?: UserRole;
  sortBy?: UserSortBy;
}

export interface CreateUserDto {
  username: string;
  password: string;
  fullName: string;
  role: UserRole;
}

export interface UpdateUserDto {
  fullName?: string;
  role?: UserRole;
}
