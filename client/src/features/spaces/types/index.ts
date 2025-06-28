import { SearchDto } from '@/shared/types/SearchTypes';

// dto.id = space.id;
//     dto.name = space.name;
//     dto.description = space.description;
//     dto.slug = space.slug;
//     dto.creatorId = space.creatorId;
//     dto.spaceType = space.spaceType;
//     dto.facultyId = space.facultyId;
//     dto.studyProgramId = space.studyProgramId;
//     dto.iconUrl = space.iconUrl;
//     dto.bannerUrl = space.bannerUrl;
//     dto.followerCount = space.followerCount ?? 0;
//     dto.isFollowing = isFollowing;
//     dto.createdAt = space.createdAt;
//     dto.updatedAt = space.updatedAt;

export enum SpaceType {
  ACADEMIC = 'academic',
  FACULTY = 'faculty',
  STUDY_PROGRAM = 'study_program',
  ORGANIZATION = 'organization',
  CAMPUS = 'campus',
  OTHER = 'other',
}

export interface Space {
  id: number;
  name: string;
  description: string;
  slug: string;
  creatorId: number;
  spaceType: SpaceType;
  facultyId: number | null;
  studyProgramId: number | null;
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
  spaceType?: SpaceType | null;
  facultyId?: number | null;
  studyProgramId?: number | null;
  following?: boolean;
  sortBy: SpaceSortBy;
}

export interface CreateSpaceDto {
  name: string;
  description: string;
  slug: string;
  spaceType: SpaceType;
  facultyId?: number | null;
  studyProgramId?: number | null;
  icon?: File;
  banner?: File;
}

export interface UpdateSpaceDto {
  name?: string;
  description?: string;
  slug?: string;
  spaceType?: SpaceType;
  facultyId?: number | null;
  studyProgramId?: number | null;
  icon?: File;
  banner?: File;
  removeIcon?: boolean;
  removeBanner?: boolean;
}
