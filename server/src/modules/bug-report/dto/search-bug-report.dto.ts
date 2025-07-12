import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { SearchDto } from '../../../common/dto/search.dto';
import { BugPriority, BugStatus } from '../entities/bug-report.entity';

/**
 * Available fields for sorting bug reports
 */
export enum BugReportSortBy {
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  TITLE = 'title',
  STATUS = 'status',
  PRIORITY = 'priority',
}

/**
 * DTO for searching and filtering bug reports with pagination
 */
export class SearchBugReportDto extends SearchDto {
  @ApiPropertyOptional({
    description: 'Filter by bug status',
    enum: BugStatus,
    enumName: 'BugStatus',
    example: BugStatus.OPEN,
  })
  @IsOptional()
  @IsEnum(BugStatus)
  status?: BugStatus;

  @ApiPropertyOptional({
    description: 'Filter by bug priority',
    enum: BugPriority,
    enumName: 'BugPriority',
    example: BugPriority.HIGH,
  })
  @IsOptional()
  @IsEnum(BugPriority)
  priority?: BugPriority;

  @ApiPropertyOptional({
    description: 'Filter by reporter user ID',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  reporterId?: number;

  @ApiPropertyOptional({
    description: 'Filter by assigned user ID',
    example: 2,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  assignedToId?: number;

  @ApiPropertyOptional({
    description: 'Field to sort bug reports by',
    enum: BugReportSortBy,
    enumName: 'BugReportSortBy',
    default: BugReportSortBy.CREATED_AT,
    example: BugReportSortBy.CREATED_AT,
  })
  @IsOptional()
  @IsEnum(BugReportSortBy, { message: 'Sort field must be a valid bug report field' })
  @Type(() => String)
  sortBy: BugReportSortBy = BugReportSortBy.CREATED_AT;
}
