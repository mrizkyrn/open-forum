import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationMetaDto } from '../../../common/dto/pagination-meta.dto';

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

  @ApiPropertyOptional({ description: 'URL to the space icon', example: '/uploads/space-icons/2023/03/icon.png' })
  iconUrl?: string;

  @ApiPropertyOptional({ description: 'URL to the space banner', example: '/uploads/space-banners/2023/03/banner.jpg' })
  bannerUrl?: string;

  @ApiProperty({ description: 'Number of followers', example: 42 })
  followerCount: number;

  @ApiProperty({ description: 'Whether the current user is following this space', example: true })
  isFollowing: boolean;

  @ApiProperty({ description: 'When the space was created' })
  createdAt: Date;

  @ApiProperty({ description: 'When the space was last updated' })
  updatedAt: Date;
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
