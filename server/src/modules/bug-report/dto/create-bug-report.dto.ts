import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { BugPriority } from '../entities/bug-report.entity';

/**
 * DTO for creating a new bug report
 */
export class CreateBugReportDto {
  @ApiProperty({
    description: 'Title of the bug report',
    example: 'Login button not working on mobile',
    maxLength: 255,
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiProperty({
    description: 'Detailed description of the bug',
    example:
      'When trying to login on mobile devices, the login button becomes unresponsive after entering credentials.',
  })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({
    description: 'Steps to reproduce the bug',
    example:
      '1. Open app on mobile\n2. Navigate to login\n3. Enter credentials\n4. Tap login button\n5. Nothing happens',
    required: false,
  })
  @IsOptional()
  @IsString()
  stepsToReproduce?: string;

  @ApiProperty({
    description: 'Environment where bug occurred',
    example: 'iOS 15.0, Safari',
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
    default: BugPriority.MEDIUM,
    required: false,
  })
  @IsOptional()
  @IsEnum(BugPriority)
  priority?: BugPriority;
}
