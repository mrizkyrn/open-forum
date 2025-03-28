import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsArray, IsDate, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { SearchDto } from '../../../common/dto/search.dto';
import { ActivityEntityType, ActivityType } from '../entities/user-activity.entity';

export enum ActivitySortBy {
  createdAt = 'createdAt',
  updatedAt = 'updatedAt',
  type = 'type',
  entityType = 'entityType',
}

export class SearchActivityDto extends SearchDto {
  @ApiProperty({
    description: 'Filter by user ID',
    example: 42,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  userId?: number;

  @ApiProperty({
    description: 'Filter by activity types',
    enum: ActivityType,
    isArray: true,
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(ActivityType, { each: true })
  @Transform(({ value }) => {
    return Array.isArray(value) ? value : typeof value === 'string' ? value.split(',') : [];
  })
  types?: ActivityType[];

  @ApiProperty({
    description: 'Filter by entity type',
    enum: ActivityEntityType,
    required: false,
  })
  @IsOptional()
  @IsEnum(ActivityEntityType)
  entityType?: ActivityEntityType;

  @ApiProperty({
    description: 'Filter by entity ID',
    example: 123,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  entityId?: number;

  @ApiProperty({
    description: 'Start date for date range filtering',
    example: '2025-01-01',
    required: false,
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  @Transform(({ value }) => (value ? new Date(value) : undefined))
  startDate?: Date;

  @ApiProperty({
    description: 'End date for date range filtering',
    example: '2025-03-01',
    required: false,
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  @Transform(({ value }) => (value ? new Date(value) : undefined))
  endDate?: Date;

  @ApiProperty({
    description: 'IP address to filter by',
    example: '192.168.1.1',
    required: false,
  })
  @IsOptional()
  @IsString()
  ipAddress?: string;

  @ApiProperty({
    description: 'Field to sort by',
    enum: ActivitySortBy,
    default: ActivitySortBy.createdAt,
    required: false,
  })
  @IsOptional()
  @IsEnum(ActivitySortBy)
  sortBy: ActivitySortBy = ActivitySortBy.createdAt;
}
