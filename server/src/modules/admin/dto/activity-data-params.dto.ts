import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import { TimePeriod } from './stats-params.dto';

export class ActivityDataParamsDto {
  @ApiPropertyOptional({ 
    enum: ['day', 'week', 'month'],
    default: 'week',
    description: 'Time range for activity data' 
  })
  @IsEnum(['day', 'week', 'month'], { message: 'TimeRange must be day, week, or month' })
  @IsOptional()
  @Transform(({ value }) => value || 'week')
  timeRange?: TimePeriod = 'week';
}