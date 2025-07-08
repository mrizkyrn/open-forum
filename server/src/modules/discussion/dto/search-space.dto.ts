import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional } from 'class-validator';
import { SearchDto } from '../../../common/dto/search.dto';
import { SpaceType } from '../entities/discussion-space.entity';

export enum SpaceSortBy {
  name = 'name',
  createdAt = 'createdAt',
  updatedAt = 'updatedAt',
  followerCount = 'followerCount',
}

export class SearchSpaceDto extends SearchDto {
  @ApiProperty({
    description: 'Filter by creator user ID',
    required: false,
    type: Number,
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  creatorId?: number;

  @ApiProperty({
    description: 'Filter by space type',
    required: false,
    enum: SpaceType,
    example: SpaceType.ACADEMIC,
  })
  @IsOptional()
  @IsEnum(SpaceType)
  @Type(() => String)
  spaceType?: SpaceType;

  @ApiProperty({
    description: 'Show only spaces followed by the current user',
    required: false,
    type: Boolean,
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  following?: boolean;

  @ApiProperty({
    description: 'Field to sort by',
    enum: SpaceSortBy,
    default: SpaceSortBy.createdAt,
    required: false,
  })
  @IsOptional()
  @IsEnum(SpaceSortBy)
  sortBy: SpaceSortBy = SpaceSortBy.createdAt;
}
