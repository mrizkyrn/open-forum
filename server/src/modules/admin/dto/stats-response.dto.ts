import { ApiProperty } from '@nestjs/swagger';
import { TimePeriod } from './stats-params.dto';

export class UserStatsDto {
  @ApiProperty({ description: 'Total number of users' })
  total: number;

  @ApiProperty({ description: 'New users in the current period' })
  new: number;

  @ApiProperty({ description: 'Active users in the current period' })
  active: number;

  @ApiProperty({ description: 'Percentage change from previous period' })
  change: number;
}

export class DiscussionStatsDto {
  @ApiProperty({ description: 'Total number of discussions' })
  total: number;

  @ApiProperty({ description: 'New discussions in the current period' })
  new: number;

  @ApiProperty({ description: 'Percentage change from previous period' })
  change: number;
}

export class ReportStatsDto {
  @ApiProperty({ description: 'Active reports pending review' })
  active: number;

  @ApiProperty({ description: 'New reports in the current period' })
  new: number;

  @ApiProperty({ description: 'Percentage change from previous period' })
  change: number;
}

export class EngagementStatsDto {
  @ApiProperty({ description: 'Engagement rate (interactions per user)' })
  rate: number;

  @ApiProperty({ description: 'Total interactions in the current period' })
  interactions: number;

  @ApiProperty({ description: 'Percentage change from previous period' })
  change: number;
}

export class PeriodMetadataDto {
  @ApiProperty({ enum: ['day', 'week', 'month'] })
  type: TimePeriod;

  @ApiProperty()
  start: Date;

  @ApiProperty()
  end: Date;
}

export class MetadataDto {
  @ApiProperty()
  currentPeriod: PeriodMetadataDto;

  @ApiProperty()
  comparisonPeriod: PeriodMetadataDto;
}

export class StatsResponseDto {
  @ApiProperty()
  users: UserStatsDto;

  @ApiProperty()
  discussions: DiscussionStatsDto;

  @ApiProperty()
  reports: ReportStatsDto;

  @ApiProperty()
  engagement: EngagementStatsDto;

  @ApiProperty()
  metadata: MetadataDto;
}
