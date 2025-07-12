import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { BugPriority, BugStatus } from '../entities/bug-report.entity';

/**
 * DTO for updating a bug report
 */
export class UpdateBugReportDto {
  @ApiProperty({
    description: 'Title of the bug report',
    example: 'Login button not working on mobile - Updated',
    maxLength: 255,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiProperty({
    description: 'Detailed description of the bug',
    example: 'Updated description with more details...',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Steps to reproduce the bug',
    example: 'Updated steps...',
    required: false,
  })
  @IsOptional()
  @IsString()
  stepsToReproduce?: string;

  @ApiProperty({
    description: 'Environment where bug occurred',
    example: 'iOS 16.0, Safari',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  environment?: string;

  @ApiProperty({
    description: 'Priority level of the bug',
    enum: BugPriority,
    example: BugPriority.HIGH,
    required: false,
  })
  @IsOptional()
  @IsEnum(BugPriority)
  priority?: BugPriority;

  @ApiProperty({
    description: 'Status of the bug report',
    enum: BugStatus,
    example: BugStatus.IN_PROGRESS,
    required: false,
  })
  @IsOptional()
  @IsEnum(BugStatus)
  status?: BugStatus;

  @ApiProperty({
    description: 'Resolution notes or comments',
    example: 'Fixed by updating the mobile CSS styles',
    required: false,
  })
  @IsOptional()
  @IsString()
  resolution?: string;
}
