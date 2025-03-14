import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional } from 'class-validator';
import { SearchDto } from '../../../common/dto/search.dto';

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
    description: 'Field to sort by',
    enum: SpaceSortBy,
    default: SpaceSortBy.createdAt,
    required: false,
  })
  @IsOptional()
  @IsEnum(SpaceSortBy)
  sortBy: SpaceSortBy = SpaceSortBy.createdAt;
}
