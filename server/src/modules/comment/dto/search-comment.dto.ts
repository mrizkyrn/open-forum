import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { SearchDto } from '../../../common/dto/search.dto';

export enum CommentSortBy {
  createdAt = 'createdAt',
  updatedAt = 'updatedAt',
  upvoteCount = 'upvoteCount',
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

  @ApiProperty({
    description: 'Whether to exclude replies from the response',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  excludeReplies?: boolean;
}
