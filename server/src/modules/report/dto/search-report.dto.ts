import { IsEnum, IsInt, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ReportStatus, ReportTargetType } from '../entities/report.entity';
import { SearchDto } from 'src/common/dto/search.dto';

export class SearchReportDto extends SearchDto {
  @ApiPropertyOptional({
    description: 'Filter by report status',
    enum: ReportStatus
  })
  @IsOptional()
  @IsEnum(ReportStatus)
  status?: ReportStatus;

  @ApiPropertyOptional({
    description: 'Filter by target type',
    enum: ReportTargetType
  })
  @IsOptional()
  @IsEnum(ReportTargetType)
  targetType?: ReportTargetType;
}