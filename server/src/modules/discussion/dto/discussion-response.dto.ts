import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from 'src/common/enums/user-role.enum';
import { PaginationMetaDto } from '../../../common/dto/pagination-meta.dto';
import { AttachmentResponseDto } from '../../../modules/attachment/dto/attachment-response.dto';
import { UserResponseDto } from '../../user/dto/user-response.dto';
import { User } from '../../user/entities/user.entity';
import { Discussion } from '../entities/discussion.entity';

class DiscussionSpaceDto {
  @ApiProperty({ description: 'Space ID', example: 1 })
  id: number;

  @ApiProperty({ description: 'Space name', example: 'General Discussion' })
  name: string;

  @ApiProperty({ description: 'Space URL slug', example: 'general-discussion' })
  slug: string;
}

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
    description: 'Whether the discussion has been edited',
    example: false,
  })
  isEdited: boolean;

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

  @ApiProperty({
    description: 'Vote value by the current user (1 for upvote, -1 for downvote, null if not voted)',
    example: 1,
    nullable: true,
  })
  voteStatus?: number | null;

  @ApiProperty({
    description: 'Space where the discussion belongs',
    nullable: true,
    type: () => DiscussionSpaceDto,
  })
  space?: DiscussionSpaceDto | null;

  static fromEntity(
    discussion: Discussion,
    currentUser?: User,
    isBookmarked: boolean = false,
    voteStatus: number | null = null,
  ): DiscussionResponseDto {
    const dto = new DiscussionResponseDto();

    // Map basic properties
    dto.id = discussion.id;
    dto.content = discussion.content;
    dto.isAnonymous = discussion.isAnonymous;
    dto.tags = discussion.tags || [];
    dto.createdAt = discussion.createdAt;
    dto.updatedAt = discussion.updatedAt;
    dto.isEdited = discussion.isEdited;
    dto.commentCount = discussion.commentCount ?? 0;
    dto.upvoteCount = discussion.upvoteCount ?? 0;
    dto.downvoteCount = discussion.downvoteCount ?? 0;

    // Map user-specific data
    dto.isBookmarked = isBookmarked;
    dto.voteStatus = voteStatus;

    // Map space if available
    dto.space = discussion.space
      ? {
          id: discussion.space.id,
          name: discussion.space.name,
          slug: discussion.space.slug,
        }
      : null;

    // Handle author based on anonymity
    if (!discussion.isAnonymous || (currentUser && currentUser.role === UserRole.ADMIN)) {
      dto.author = discussion.author ? UserResponseDto.fromEntity(discussion.author) : null;
    } else if (currentUser && currentUser.id === discussion.authorId) {
      dto.author = UserResponseDto.createAnonymous(currentUser.id);
    } else {
      dto.author = UserResponseDto.createAnonymous();
    }

    // Process attachments
    if (discussion.attachments?.length > 0) {
      dto.attachments = [...discussion.attachments].sort((a, b) => a.displayOrder - b.displayOrder);
    } else {
      dto.attachments = [];
    }

    return dto;
  }
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

export class PopularTagsResponseDto {
  @ApiProperty({ description: 'Tag name', example: 'nestjs' })
  tag: string;

  @ApiProperty({ description: 'Number of times the tag is used', example: 42 })
  count: number;
}

