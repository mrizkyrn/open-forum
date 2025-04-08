import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationMetaDto } from '../../../common/dto/pagination-meta.dto';
import { DiscussionSpace, SpaceType } from '../entities/discussion-space.entity';

export class FacultyBriefDto {
  @ApiProperty({ description: 'Faculty ID', example: 1 })
  id: number;

  @ApiProperty({ description: 'Faculty name', example: 'Faculty of Computer Science' })
  name: string;

  @ApiProperty({ description: 'Faculty abbreviation', example: 'FCS' })
  abbreviation: string;
}

export class StudyProgramBriefDto {
  @ApiProperty({ description: 'Study Program ID', example: 1 })
  id: number;

  @ApiProperty({ description: 'Study Program name', example: 'Computer Science' })
  name: string;

  @ApiProperty({ description: 'Study Program code', example: 'CS' })
  code: string;
}

export class DiscussionSpaceResponseDto {
  @ApiProperty({ description: 'Unique identifier', example: 1 })
  id: number;

  @ApiProperty({ description: 'Name of the discussion space', example: 'Programming' })
  name: string;

  @ApiPropertyOptional({ description: 'Description of the space', example: 'A space for programming discussions' })
  description?: string;

  @ApiProperty({ description: 'URL-friendly slug', example: 'programming' })
  slug: string;

  @ApiProperty({ description: 'ID of the user who created this space', example: 1 })
  creatorId: number;

  @ApiProperty({
    enum: SpaceType,
    enumName: 'SpaceType',
    description: 'Type of space',
    example: SpaceType.ACADEMIC,
  })
  spaceType: SpaceType;

  @ApiPropertyOptional({ description: 'Faculty ID if associated with a faculty', example: 1 })
  facultyId?: number | null;

  @ApiPropertyOptional({ type: FacultyBriefDto, description: 'Brief information about associated faculty' })
  faculty?: FacultyBriefDto | null;

  @ApiPropertyOptional({ description: 'Study Program ID if associated with a study program', example: 1 })
  studyProgramId?: number | null;

  @ApiPropertyOptional({ type: StudyProgramBriefDto, description: 'Brief information about associated study program' })
  studyProgram?: StudyProgramBriefDto | null;

  @ApiPropertyOptional({ description: 'URL to the space icon', example: '/uploads/space-icons/2023/03/icon.png' })
  iconUrl?: string | null;

  @ApiPropertyOptional({ description: 'URL to the space banner', example: '/uploads/space-banners/2023/03/banner.jpg' })
  bannerUrl?: string | null;

  @ApiProperty({ description: 'Number of followers', example: 42 })
  followerCount: number;

  @ApiProperty({ description: 'Whether the current user is following this space', example: true })
  isFollowing: boolean;

  @ApiProperty({ description: 'When the space was created' })
  createdAt: Date;

  @ApiProperty({ description: 'When the space was last updated' })
  updatedAt: Date;

  static fromEntity(space: DiscussionSpace, isFollowing: boolean): DiscussionSpaceResponseDto {
    const dto = new DiscussionSpaceResponseDto();

    dto.id = space.id;
    dto.name = space.name;
    dto.description = space.description;
    dto.slug = space.slug;
    dto.creatorId = space.creatorId;
    dto.spaceType = space.spaceType;
    dto.facultyId = space.facultyId;
    dto.studyProgramId = space.studyProgramId;
    dto.iconUrl = space.iconUrl;
    dto.bannerUrl = space.bannerUrl;
    dto.followerCount = space.followerCount ?? 0;
    dto.isFollowing = isFollowing;
    dto.createdAt = space.createdAt;
    dto.updatedAt = space.updatedAt;

    // Add faculty info if available
    if (space.faculty) {
      dto.faculty = {
        id: space.faculty.id,
        name: space.faculty.facultyName,
        abbreviation: space.faculty.facultyAbbreviation,
      };
    }

    // Add study program info if available
    if (space.studyProgram) {
      dto.studyProgram = {
        id: space.studyProgram.id,
        name: space.studyProgram.studyProgramName,
        code: space.studyProgram.studyProgramCode,
      };
    }

    return dto;
  }
}

export class PageableDiscussionSpaceResponseDto {
  @ApiProperty({ type: [DiscussionSpaceResponseDto] })
  items: DiscussionSpaceResponseDto[];

  @ApiProperty({
    type: PaginationMetaDto,
    description: 'Pagination metadata',
  })
  meta: PaginationMetaDto;
}
