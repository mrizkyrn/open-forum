import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export type TimePeriod = 'day' | 'week' | 'month';

export class StatsParamsDto {
  @ApiPropertyOptional({ 
    enum: ['day', 'week', 'month'],
    default: 'day',
    description: 'Time period to analyze' 
  })
  @IsEnum(['day', 'week', 'month'], { message: 'Period must be day, week, or month' })
  @IsOptional()
  @Transform(({ value }) => value || 'day')
  period?: TimePeriod = 'day';

  @ApiPropertyOptional({ 
    enum: ['day', 'week', 'month'],
    description: 'Period type for comparison (defaults to same as period)' 
  })
  @IsEnum(['day', 'week', 'month'], { message: 'Comparison must be day, week, or month' })
  @IsOptional()
  comparison?: TimePeriod;
}