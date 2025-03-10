import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ReportTargetType } from '../entities/report.entity';

export class CreateReportDto {
  @ApiProperty({
    description: 'The type of content being reported',
    enum: ReportTargetType,
    example: ReportTargetType.DISCUSSION,
  })
  @IsNotEmpty()
  @IsEnum(ReportTargetType)
  targetType: ReportTargetType;

  @ApiProperty({
    description: 'The ID of the content being reported',
    example: 1,
  })
  @IsNotEmpty()
  @IsInt()
  targetId: number;

  @ApiProperty({
    description: 'The ID of the reason for the report',
    example: 1,
  })
  @IsNotEmpty()
  @IsInt()
  reasonId: number;

  @ApiProperty({
    description: 'Additional details about the report',
    example: 'This post contains offensive language',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;
}
