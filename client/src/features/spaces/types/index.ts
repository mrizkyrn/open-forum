import { BaseQueryParams } from '@/shared/types/RequestTypes';

// ===== CORE ENTITIES =====

export interface Space {
  id: number;
  name: string;
  description: string;
  slug: string;
  creatorId: number;
  spaceType: SpaceType;
  iconUrl?: string | null;
  bannerUrl?: string | null;
  followerCount: number;
  isFollowing: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ===== REQUEST TYPES =====

export interface CreateSpaceRequest {
  name: string;
  description: string;
  slug: string;
  spaceType: SpaceType;
  icon?: File;
  banner?: File;
}

export interface UpdateSpaceRequest {
  name?: string;
  description?: string;
  slug?: string;
  spaceType?: SpaceType;
  icon?: File;
  banner?: File;
  removeIcon?: boolean;
  removeBanner?: boolean;
}

// ===== QUERY PARAMETERS =====

export interface SpaceQueryParams extends BaseQueryParams {
  creatorId?: number;
  spaceType?: SpaceType | null;
  following?: boolean;
  sortBy: SpaceSortBy;
}

// ===== ENUMS =====

export enum SpaceType {
  ACADEMIC = 'academic',
  ORGANIZATION = 'organization',
  CAMPUS = 'campus',
  OTHER = 'other',
}

export enum SpaceSortBy {
  name = 'name',
  createdAt = 'createdAt',
  updatedAt = 'updatedAt',
  followerCount = 'followerCount',
}
