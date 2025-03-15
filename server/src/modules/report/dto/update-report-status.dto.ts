import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { ReportStatus } from '../entities/report.entity';

export class UpdateReportStatusDto {
  @ApiProperty({
    description: 'The new status for the report',
    enum: ReportStatus,
    example: ReportStatus.RESOLVED,
  })
  @IsNotEmpty()
  @IsEnum(ReportStatus)
  status: ReportStatus;
}
