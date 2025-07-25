import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { SearchDto } from '../../../common/dto/search.dto';
import { ReportStatus, ReportTargetType } from '../entities/report.entity';

export enum ReportSortBy {
  createdAt = 'createdAt',
  updatedAt = 'updatedAt',
  reviewedAt = 'reviewedAt',
}

export class SearchReportDto extends SearchDto {
  @ApiPropertyOptional({
    description: 'Filter by report status',
    enum: ReportStatus,
  })
  @IsOptional()
  @IsEnum(ReportStatus)
  status?: ReportStatus;

  @ApiPropertyOptional({
    description: 'Filter by target type',
    enum: ReportTargetType,
  })
  @IsOptional()
  @IsEnum(ReportTargetType)
  targetType?: ReportTargetType;

  @ApiPropertyOptional({
    description: 'Field to sort by',
    enum: ReportSortBy,
    default: ReportSortBy.createdAt,
  })
  @IsOptional()
  @IsEnum(ReportSortBy)
  sortBy: ReportSortBy = ReportSortBy.createdAt;
}
