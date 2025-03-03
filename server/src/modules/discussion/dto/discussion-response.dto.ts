import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserResponseDto } from '../../user/dto/user-response.dto';
import { PaginationMetaDto } from '../../../common/dto/pagination-meta.dto';
import { AttachmentResponseDto } from '../../../modules/attachment/dto/attachment-response.dto';

export class DiscussionResponseDto {
  @ApiProperty({
    description: 'Unique identifier of the discussion',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Main content of the discussion',
    example: 'I am trying to understand how JWT authentication works in NestJS...',
  })
  content: string;

  @ApiProperty({
    description: 'Whether the author identity is hidden',
    example: false,
  })
  isAnonymous: boolean;

  @ApiPropertyOptional({
    description: 'Tags/categories for the discussion',
    example: ['nestjs', 'authentication', 'jwt'],
    type: [String],
  })
  tags?: string[];

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2023-01-01T00:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2023-01-01T00:00:00Z',
  })
  updatedAt: Date;

  @ApiPropertyOptional({
    description: 'User who created the discussion (null if anonymous)',
    type: () => UserResponseDto,
    nullable: true,
  })
  author?: UserResponseDto | null;

  @ApiProperty({
    description: 'Attachment files uploaded with the discussion',
    type: () => AttachmentResponseDto,
    isArray: true,
    nullable: true,
  })
  attachments: AttachmentResponseDto[];

  @ApiProperty({
    description: 'Number of comments on the discussion',
    example: 5,
    default: 0,
  })
  commentCount: number;

  @ApiProperty({
    description: 'Number of upvotes on the discussion',
    example: 10,
    default: 0,
  })
  upvoteCount: number;

  @ApiProperty({
    description: 'Number of downvotes on the discussion',
    example: 2,
    default: 0,
  })
  downvoteCount: number;

  @ApiProperty({
    description: 'Whether the current user has bookmarked this discussion',
    example: false,
  })
  isBookmarked?: boolean;
}

export class PageableDiscussionResponseDto {
  @ApiProperty({
    type: DiscussionResponseDto,
    description: 'List of users',
    isArray: true,
  })
  items: DiscussionResponseDto[];

  @ApiProperty({
    type: PaginationMetaDto,
    description: 'Pagination metadata',
  })
  meta: PaginationMetaDto;
}
