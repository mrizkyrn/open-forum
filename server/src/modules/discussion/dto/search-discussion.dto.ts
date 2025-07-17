import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsArray, IsBoolean, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { SearchDto } from '../../../common/dto/search.dto';

export enum DiscussionSortBy {
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  COMMENT_COUNT = 'commentCount',
  VOTE_COUNT = 'voteCount',
}

export class SearchDiscussionDto extends SearchDto {
  @ApiPropertyOptional({
    description: 'Filter by discussion tags (comma separated or array)',
    example: ['nestjs', 'authentication', 'jwt'],
    type: [String],
    isArray: true,
  })
  @IsOptional()
  @IsArray({ message: 'Tags must be an array' })
  @IsString({ each: true, message: 'Each tag must be a string' })
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value.map((t) => t.trim());
    if (typeof value === 'string') {
      return value
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
    }
    return [];
  })
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Field to sort by',
    enum: DiscussionSortBy,
    enumName: 'DiscussionSortBy',
    default: DiscussionSortBy.CREATED_AT,
    example: DiscussionSortBy.CREATED_AT,
  })
  @IsOptional()
  @IsEnum(DiscussionSortBy, { message: 'Sort field must be a valid discussion field' })
  @Type(() => String)
  sortBy: DiscussionSortBy = DiscussionSortBy.CREATED_AT;

  @ApiPropertyOptional({
    description: 'Filter by author ID',
    example: 42,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'authorId must be a number' })
  authorId?: number;

  @ApiPropertyOptional({
    description: 'Filter anonymous/non-anonymous posts',
    example: true,
    type: Boolean,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @IsBoolean({ message: 'isAnonymous must be a boolean' })
  isAnonymous?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by space id',
    example: 2,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'spaceId must be a number' })
  spaceId?: number;

  @ApiPropertyOptional({
    description: 'Only show discussions from spaces the user follows',
    example: true,
    type: Boolean,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @IsBoolean({ message: 'onlyFollowedSpaces must be a boolean' })
  onlyFollowedSpaces?: boolean;
}
