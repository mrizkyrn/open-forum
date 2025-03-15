import { ApiProperty } from '@nestjs/swagger';

export class UserStatisticsDto {
  @ApiProperty({ description: 'Total number of users', example: 1500 })
  total: number;

  @ApiProperty({ description: 'New users in the selected period', example: 42 })
  new: number;

  @ApiProperty({ description: 'Active users in the selected period', example: 350 })
  active: number;

  @ApiProperty({ description: 'Percentage change compared to previous period', example: 12 })
  change: number;
}

export class DiscussionStatisticsDto {
  @ApiProperty({ description: 'Total number of discussions', example: 980 })
  total: number;

  @ApiProperty({ description: 'New discussions in the selected period', example: 87 })
  new: number;

  @ApiProperty({ description: 'Percentage change compared to previous period', example: -5 })
  change: number;
}

export class ReportStatisticsDto {
  @ApiProperty({ description: 'Currently active reports', example: 23 })
  active: number;

  @ApiProperty({ description: 'New reports in the selected period', example: 12 })
  new: number;

  @ApiProperty({ description: 'Percentage change compared to previous period', example: 8 })
  change: number;
}

export class EngagementStatisticsDto {
  @ApiProperty({ description: 'Engagement rate (interactions per user)', example: 2.7 })
  rate: number;

  @ApiProperty({ description: 'Total interactions in the selected period', example: 4230 })
  interactions: number;

  @ApiProperty({ description: 'Percentage change compared to previous period', example: 15 })
  change: number;
}

export class PeriodMetadataDto {
  @ApiProperty({ description: 'Period type', example: 'week', enum: ['day', 'week', 'month'] })
  type: string;

  @ApiProperty({ description: 'Period start date', example: '2025-03-09T00:00:00.000Z' })
  start: Date;

  @ApiProperty({ description: 'Period end date', example: '2025-03-16T00:00:00.000Z' })
  end: Date;
}

export class StatisticsMetadataDto {
  @ApiProperty({ description: 'Current period information' })
  currentPeriod: PeriodMetadataDto;

  @ApiProperty({ description: 'Comparison period information' })
  comparisonPeriod: PeriodMetadataDto;
}

export class DashboardStatsResponseDto {
  @ApiProperty({ description: 'User statistics' })
  users: UserStatisticsDto;

  @ApiProperty({ description: 'Discussion statistics' })
  discussions: DiscussionStatisticsDto;

  @ApiProperty({ description: 'Report statistics' })
  reports: ReportStatisticsDto;

  @ApiProperty({ description: 'Engagement statistics' })
  engagement: EngagementStatisticsDto;

  @ApiProperty({ description: 'Metadata about the time periods' })
  metadata: StatisticsMetadataDto;
}
