import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { SearchDto } from '../../../common/dto/search.dto';

export enum CommentSortBy {
  createdAt = 'createdAt',
  updatedAt = 'updatedAt',
  upvoteCount = 'upvoteCount',
  replyCount = 'replyCount',
}

export class SearchCommentDto extends SearchDto {
  @ApiProperty({
    description: 'Field to sort by',
    enum: CommentSortBy,
    default: CommentSortBy.createdAt,
    required: false,
  })
  @IsEnum(CommentSortBy)
  @IsOptional()
  sortBy?: CommentSortBy;
}
