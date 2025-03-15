import { ApiProperty } from '@nestjs/swagger';

export class TimeSeriesDataPointDto {
  @ApiProperty({ description: 'Date of the data point', example: '2025-03-15' })
  date: string;

  @ApiProperty({ description: 'Value for this data point', example: 42 })
  value: number;
}

export class ActivitySeriesDto {
  @ApiProperty({ description: 'Name of the data series', example: 'Discussions' })
  name: string;

  @ApiProperty({ description: 'Series data points', type: [TimeSeriesDataPointDto] })
  data: TimeSeriesDataPointDto[];

  @ApiProperty({ description: 'Series color for charts', example: '#10B981' })
  color: string;
}

export class ActivityDataResponseDto {
  @ApiProperty({ description: 'Activity data series', type: [ActivitySeriesDto] })
  series: ActivitySeriesDto[];

  @ApiProperty({ description: 'Time range of the data', example: 'week', enum: ['day', 'week', 'month'] })
  timeRange: string;

  @ApiProperty({ description: 'Start date of the time range', example: '2025-03-09' })
  startDate: string;

  @ApiProperty({ description: 'End date of the time range', example: '2025-03-16' })
  endDate: string;
}
