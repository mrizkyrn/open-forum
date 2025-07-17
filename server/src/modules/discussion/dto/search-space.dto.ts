import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional } from 'class-validator';
import { SearchDto } from '../../../common/dto/search.dto';
import { SpaceType } from '../entities/discussion-space.entity';

export enum SpaceSortBy {
  NAME = 'name',
  FOLLOWER_COUNT = 'followerCount',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
}

export class SearchSpaceDto extends SearchDto {
  @ApiPropertyOptional({
    description: 'Filter by creator user ID',
    example: 1,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'creatorId must be a number' })
  creatorId?: number;

  @ApiPropertyOptional({
    description: 'Filter by space type',
    enum: SpaceType,
    example: SpaceType.GENERAL,
  })
  @IsOptional()
  @IsEnum(SpaceType, { message: 'spaceType must be a valid SpaceType' })
  @Type(() => String)
  spaceType?: SpaceType;

  @ApiPropertyOptional({
    description: 'Show only spaces followed by the current user',
    example: true,
    type: Boolean,
  })
  @IsOptional()
  @Type(() => Boolean)
  following?: boolean;

  @ApiPropertyOptional({
    description: 'Field to sort by',
    enum: SpaceSortBy,
    default: SpaceSortBy.CREATED_AT,
    required: false,
  })
  @IsOptional()
  @IsEnum(SpaceSortBy)
  sortBy: SpaceSortBy = SpaceSortBy.CREATED_AT;
}
