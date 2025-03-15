import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { ReportStatus } from '../entities/report.entity';

export class HandleReportDto {
  @ApiProperty({
    enum: ReportStatus,
    description: 'Status to set for the report',
    example: ReportStatus.RESOLVED,
    required: true,
  })
  @IsEnum(ReportStatus)
  status: ReportStatus;

  @ApiProperty({
    description: 'Whether to delete the reported content',
    example: true,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  deleteContent?: boolean = false;

  @ApiProperty({
    description: 'Message to include in notifications',
    example: 'Your content violated our community guidelines',
    required: false,
  })
  @IsString()
  @IsOptional()
  message?: string;

  @ApiProperty({
    description: 'Whether to notify the reporter about the action',
    default: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  notifyReporter?: boolean = true;

  @ApiProperty({
    description: 'Whether to notify the content author about the action',
    default: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  notifyAuthor?: boolean = true;
}
