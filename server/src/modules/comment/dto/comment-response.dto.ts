import { ApiProperty } from '@nestjs/swagger';
import { PaginationMetaDto } from '../../../common/dto/pagination-meta.dto';
import { AttachmentResponseDto } from '../../attachment/dto/attachment-response.dto';
import { UserResponseDto } from '../../user/dto/user-response.dto';
import { Comment } from '../entities/comment.entity';

export class CommentResponseDto {
  @ApiProperty({
    description: 'Comment ID',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Comment content',
    example: 'This is a comment on the discussion',
  })
  content: string;

  @ApiProperty({
    description: 'Author of the comment',
    type: () => UserResponseDto,
  })
  author: UserResponseDto;

  @ApiProperty({
    description: 'Whether the comment has been edited',
    example: false,
  })
  isEdited: boolean;

  @ApiProperty({
    description: 'ID of the discussion this comment belongs to',
    example: 1,
  })
  discussionId: number;

  @ApiProperty({
    description: 'ID of the parent comment if this is a reply',
    example: 1,
    nullable: true,
  })
  parentId: number | null;

  @ApiProperty({
    description: 'Replies to this comment',
    type: [CommentResponseDto],
  })
  replies?: CommentResponseDto[];

  @ApiProperty({
    description: 'Number of replies to this comment',
    example: 5,
  })
  replyCount: number;

  @ApiProperty({
    description: 'Number of upvotes',
    example: 10,
  })
  upvoteCount: number;

  @ApiProperty({
    description: 'Number of downvotes',
    example: 2,
  })
  downvoteCount: number;

  @ApiProperty({
    description: 'Comment creation timestamp',
    example: '2023-07-15T10:30:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Comment last update timestamp',
    example: '2023-07-15T10:30:00Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'Attachment files uploaded with the comment',
    type: () => AttachmentResponseDto,
    isArray: true,
  })
  attachments: AttachmentResponseDto[];

  @ApiProperty({
    description: 'Vote value by the current user (1 for upvote, -1 for downvote, null if not voted)',
    example: 1,
    nullable: true,
  })
  voteStatus?: number | null;

  @ApiProperty({
    description: 'List of user IDs mentioned in the comment',
    type: [Number],
    nullable: true,
  })
  mentionedUsers?: UserResponseDto[];

  static fromEntity(comment: Comment, voteStatus?: number | null): CommentResponseDto {
    const dto = new CommentResponseDto();

    dto.id = comment.id;
    dto.content = comment.content;
    dto.createdAt = comment.createdAt;
    dto.updatedAt = comment.updatedAt;
    dto.isEdited = comment.isEdited;
    dto.discussionId = comment.discussionId;
    dto.parentId = comment.parentId;
    dto.upvoteCount = comment.upvoteCount;
    dto.downvoteCount = comment.downvoteCount;
    dto.replyCount = comment.replyCount;

    // Handle author info
    if (comment.author) {
      dto.author = UserResponseDto.fromEntity(comment.author);
    }

    // Handle attachments
    if (comment.attachments && comment.attachments.length > 0) {
      dto.attachments = [...comment.attachments].sort((a, b) => a.displayOrder - b.displayOrder);
    } else {
      dto.attachments = [];
    }

    // Hdandle mentions
    if (comment.mentions && comment.mentions.length > 0) {
      dto.mentionedUsers = comment.mentions.map((mention) => UserResponseDto.fromEntity(mention.user));
    } else {
      dto.mentionedUsers = [];
    }

    // Handle replies if present
    if (comment.replies && comment.replies.length > 0) {
      dto.replies = comment.replies.map((reply) => CommentResponseDto.fromEntity(reply));
    }

    // Add vote status if provided
    if (voteStatus !== undefined) {
      dto.voteStatus = voteStatus;
    }

    return dto;
  }
}

export class PageableCommentResponseDto {
  @ApiProperty({
    description: 'Array of comments',
    type: [CommentResponseDto],
  })
  items: CommentResponseDto[];

  @ApiProperty({
    type: PaginationMetaDto,
    description: 'Pagination metadata',
  })
  meta: PaginationMetaDto;
}
