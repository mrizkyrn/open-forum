import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsArray, IsBoolean, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { SearchDto } from '../../../common/dto/search.dto';

export enum DiscussionSortBy {
  createdAt = 'createdAt',
  updatedAt = 'updatedAt',
  commentCount = 'commentCount',
  voteCount = 'voteCount',
}

export class SearchDiscussionDto extends SearchDto {
  @ApiProperty({
    description: 'Filter by discussion tags (comma separated or array)',
    example: ['nestjs', 'authentication', 'jwt'],
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    return Array.isArray(value) ? value : typeof value === 'string' ? value.split(',').map((t) => t.trim()) : [];
  })
  tags?: string[];

  @ApiProperty({
    description: 'Field to sort by',
    enum: DiscussionSortBy,
    default: DiscussionSortBy.createdAt,
    required: false,
  })
  @IsOptional()
  @IsEnum(DiscussionSortBy)
  sortBy: DiscussionSortBy = DiscussionSortBy.createdAt;

  @ApiProperty({
    description: 'Filter by author ID',
    example: 42,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  authorId?: number;

  @ApiProperty({
    description: 'Filter anonymous/non-anonymous posts',
    example: true,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  isAnonymous?: boolean;

  @ApiProperty({
    description: 'Filter by space id',
    example: 2,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  spaceId?: number;
}
