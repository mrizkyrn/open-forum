import { SearchDto } from '@/types/SearchTypes';

export interface Space {
  id: number;
  name: string;
  description: string;
  slug: string;
  creatorId: number;
  iconUrl?: string | null;
  bannerUrl?: string | null;
  followerCount: number;
  isFollowing: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum SpaceSortBy {
  name = 'name',
  createdAt = 'createdAt',
  updatedAt = 'updatedAt',
  followerCount = 'followerCount',
}

export interface SearchSpaceDto extends SearchDto {
  creatorId?: number;
  sortBy: SpaceSortBy;
}

export interface CreateSpaceDto {
  name: string;
  description: string;
  slug: string;
  icon?: File;
  banner?: File;
}

export interface UpdateSpaceDto {
  name?: string;
  description?: string;
  slug?: string;
  icon?: File;
  banner?: File;
  removeIcon?: boolean;
  removeBanner?: boolean;
}