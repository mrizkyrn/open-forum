import { ApiProperty } from '@nestjs/swagger';

export class TimeSeriesDataPointDto {
  @ApiProperty({ description: 'Date in YYYY-MM-DD format' })
  date: string;

  @ApiProperty({ description: 'Count value for the date' })
  value: number;
}

export class TimeSeriesDto {
  @ApiProperty({ description: 'Name of the data series' })
  name: string;

  @ApiProperty({ type: [TimeSeriesDataPointDto] })
  data: TimeSeriesDataPointDto[];

  @ApiProperty({ description: 'HEX color code for the series' })
  color: string;
}

export class ActivityDataResponseDto {
  @ApiProperty({ type: [TimeSeriesDto] })
  series: TimeSeriesDto[];
}
