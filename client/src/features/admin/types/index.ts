export type TimePeriod = 'day' | 'week' | 'month';

export interface TimeSeriesDataPoint {
  date: string;
  value: number;
}

export interface TimeSeriesDto {
  name: string;
  data: TimeSeriesDataPoint[];
  color: string;
}

export interface ActivityData {
  series: TimeSeriesDto[];
}

export interface PeriodMetadata {
  type: TimePeriod;
  start: string;
  end: string;
}

export interface StatsMetadata {
  currentPeriod: PeriodMetadata;
  comparisonPeriod: PeriodMetadata;
}

export interface UserStats {
  total: number;
  new: number;
  active: number;
  change: number;
}

export interface DiscussionStats {
  total: number;
  new: number;
  change: number;
}

export interface ReportStats {
  active: number;
  new: number;
  change: number;
}

export interface EngagementStats {
  rate: number;
  interactions: number;
  change: number;
}

export interface DashboardStats {
  users: UserStats;
  discussions: DiscussionStats;
  reports: ReportStats;
  engagement: EngagementStats;
  metadata: StatsMetadata;
}

export interface ActivityItem {
  id: string;
  type: string;
  user: {
    id: number;
    name: string;
    avatarUrl: string;
  } | null;
  action: string;
  target?: {
    id: number;
    title: string;
    type: string;
  };
  createdAt: Date;
  details?: string;
}

export interface StatsParams {
  period?: TimePeriod;
  comparison?: TimePeriod;
}

export interface ActivityDataParams {
  timeRange?: TimePeriod;
}
