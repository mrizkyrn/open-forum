import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { BugStatus } from '../entities/bug-report.entity';

/**
 * DTO for updating bug report status
 */
export class UpdateBugReportStatusDto {
  @ApiProperty({
    description: 'New status for the bug report',
    enum: BugStatus,
    example: BugStatus.IN_PROGRESS,
  })
  @IsEnum(BugStatus)
  status: BugStatus;

  @ApiProperty({
    description: 'Optional resolution description (required when setting status to RESOLVED or CLOSED)',
    example: 'Fixed the authentication issue by updating the JWT validation logic',
    required: false,
  })
  @IsOptional()
  @IsString()
  resolution?: string;
}
