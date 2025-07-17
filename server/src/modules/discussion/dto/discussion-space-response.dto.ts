import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationMetaDto } from '../../../common/dto/pagination-meta.dto';
import { DiscussionSpace, SpaceType } from '../entities/discussion-space.entity';

/**
 * DTO for returning discussion space details
 */
export class DiscussionSpaceResponseDto {
  @ApiProperty({ description: 'Unique identifier', example: 1, type: Number })
  id: number;

  @ApiProperty({ description: 'Name of the discussion space', example: 'Programming', maxLength: 100 })
  name: string;

  @ApiPropertyOptional({
    description: 'Description of the space',
    example: 'A space for programming discussions',
    maxLength: 255,
  })
  description?: string;

  @ApiProperty({ description: 'URL-friendly slug', example: 'programming', maxLength: 100 })
  slug: string;

  @ApiProperty({ description: 'ID of the user who created this space', example: 1, type: Number })
  creatorId: number;

  @ApiProperty({
    enum: SpaceType,
    enumName: 'SpaceType',
    description: 'Type of space',
    example: SpaceType.GENERAL,
  })
  spaceType: SpaceType;

  @ApiPropertyOptional({ description: 'URL to the space icon', example: '/uploads/space-icons/2023/03/icon.png' })
  iconUrl?: string | null;

  @ApiPropertyOptional({ description: 'URL to the space banner', example: '/uploads/space-banners/2023/03/banner.jpg' })
  bannerUrl?: string | null;

  @ApiProperty({ description: 'Number of followers', example: 42, type: Number })
  followerCount: number;

  @ApiProperty({ description: 'Whether the current user is following this space', example: true, type: Boolean })
  isFollowing: boolean;

  @ApiProperty({ description: 'When the space was created', type: String })
  createdAt: Date;

  @ApiProperty({ description: 'When the space was last updated', type: String })
  updatedAt: Date;

  static fromEntity(space: DiscussionSpace, isFollowing: boolean): DiscussionSpaceResponseDto {
    const dto = new DiscussionSpaceResponseDto();

    dto.id = space.id;
    dto.name = space.name;
    dto.description = space.description;
    dto.slug = space.slug;
    dto.creatorId = space.creatorId;
    dto.spaceType = space.spaceType;
    dto.iconUrl = space.iconUrl;
    dto.bannerUrl = space.bannerUrl;
    dto.followerCount = space.followerCount ?? 0;
    dto.isFollowing = isFollowing;
    dto.createdAt = space.createdAt;
    dto.updatedAt = space.updatedAt;

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
