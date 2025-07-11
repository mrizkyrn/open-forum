import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { format, startOfDay, subDays } from 'date-fns';
import { CommentService } from '../comment/comment.service';
import { DiscussionService } from '../discussion/discussion.service';
import { ReportStatus } from '../report/entities/report.entity';
import { ReportService } from '../report/report.service';
import { UserService } from '../user/user.service';
import { VoteService } from '../vote/vote.service';
import { ActivityDataResponseDto } from './dto/activity-data-response.dto';
import { DashboardStatsResponseDto } from './dto/dashboard-stats-response.dto';
import { PeriodRanges, TimeSeriesDataPoint } from './interfaces/admin.interface';
import { EntityType, TimeRangeType } from './types/admin.type';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private readonly userService: UserService,
    private readonly discussionService: DiscussionService,
    private readonly commentService: CommentService,
    private readonly voteService: VoteService,
    private readonly reportService: ReportService,
  ) {}

  // ----- Dashboard Statistics -----

  async getDashboardStats(
    currentPeriod: TimeRangeType = 'day',
    comparisonPeriod?: TimeRangeType,
  ): Promise<DashboardStatsResponseDto> {
    try {
      // Use the provided comparison period or default to current period type
      comparisonPeriod = comparisonPeriod || currentPeriod;
      const now = new Date();

      // Calculate period ranges based on parameters
      const periods = this.calculatePeriodRanges(now, currentPeriod, comparisonPeriod);

      // Fetch stats for each entity type in parallel
      const [userStats, discussionStats, reportStats, engagementStats] = await Promise.all([
        this.getUserStats(periods),
        this.getDiscussionStats(periods),
        this.getReportStats(periods),
        this.getEngagementStats(periods),
      ]);

      return {
        users: userStats,
        discussions: discussionStats,
        reports: reportStats,
        engagement: engagementStats,
        metadata: {
          currentPeriod: {
            type: currentPeriod,
            start: periods.current.start,
            end: periods.current.end,
          },
          comparisonPeriod: {
            type: comparisonPeriod,
            start: periods.previous.start,
            end: periods.previous.end,
          },
        },
      };
    } catch (error) {
      this.logger.error(`Error calculating dashboard stats: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getActivityData(timeRange: TimeRangeType = 'week'): Promise<ActivityDataResponseDto> {
    try {
      const today = new Date();
      const startDate = this.getStartDateForRange(today, timeRange);

      // Fetch all entity time series in parallel
      const [discussions, comments, users, votes] = await Promise.all([
        this.getTimeSeries('discussions', startDate, today),
        this.getTimeSeries('comments', startDate, today),
        this.getTimeSeries('users', startDate, today),
        this.getTimeSeries('votes', startDate, today),
      ]);

      // Structure the response with consistent formatting
      return {
        series: [
          {
            name: 'Discussions',
            data: discussions,
            color: '#10B981', // Green
          },
          {
            name: 'Comments',
            data: comments,
            color: '#3B82F6', // Blue
          },
          {
            name: 'Users',
            data: users,
            color: '#8B5CF6', // Purple
          },
          {
            name: 'Votes',
            data: votes,
            color: '#F59E0B', // Amber
          },
        ],
        timeRange,
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(today, 'yyyy-MM-dd'),
      };
    } catch (error) {
      this.logger.error(`Error generating activity data: ${error.message}`, error.stack);
      throw error;
    }
  }

  // ----- Helper Methods -----

  private calculatePeriodRanges(
    now: Date,
    currentPeriod: TimeRangeType,
    comparisonPeriod: TimeRangeType,
  ): PeriodRanges {
    // Set current period start date
    const currentStart = this.getStartDateForRange(now, currentPeriod);

    // Set previous period start date based on comparison period
    let previousPeriodDays: number;

    switch (comparisonPeriod) {
      case 'day':
        previousPeriodDays = 1;
        break;
      case 'week':
        previousPeriodDays = 7;
        break;
      case 'month':
        previousPeriodDays = 30;
        break;
    }

    const previousStart = subDays(currentStart, previousPeriodDays);

    return {
      current: {
        start: currentStart,
        end: now,
      },
      previous: {
        start: previousStart,
        end: currentStart,
      },
    };
  }

  private getStartDateForRange(now: Date, timeRange: TimeRangeType): Date {
    switch (timeRange) {
      case 'day':
        return startOfDay(subDays(now, 1));
      case 'week':
        return startOfDay(subDays(now, 7));
      case 'month':
        return startOfDay(subDays(now, 30));
      default:
        throw new BadRequestException('Invalid time range');
    }
  }

  private calculatePercentageChange(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  }

  private async getTimeSeries(entityType: EntityType, startDate: Date, endDate: Date): Promise<TimeSeriesDataPoint[]> {
    const service = this.getServiceForEntityType(entityType);
    const results = await service.getTimeSeries(startDate, endDate);

    return results.map((item) => ({
      date: item.date,
      value: parseInt(item.count, 10),
    }));
  }

  private getServiceForEntityType(entityType: EntityType): any {
    switch (entityType) {
      case 'discussions':
        return this.discussionService;
      case 'comments':
        return this.commentService;
      case 'users':
        return this.userService;
      case 'votes':
        return this.voteService;
      default:
        throw new BadRequestException('Invalid entity type');
    }
  }

  private async getUserStats(periods: PeriodRanges): Promise<any> {
    const [totalUsers, newUsers, previousPeriodNewUsers, activeUsers] = await Promise.all([
      this.userService.getTotalUserCount(),
      this.userService.getUserCountByDateRange(periods.current.start, periods.current.end),
      this.userService.getUserCountByDateRange(periods.previous.start, periods.previous.end),
      this.userService.getActiveUserCount(periods.current.start),
    ]);

    return {
      total: totalUsers,
      new: newUsers,
      active: activeUsers,
      change: this.calculatePercentageChange(newUsers, previousPeriodNewUsers),
    };
  }

  private async getDiscussionStats(periods: PeriodRanges): Promise<any> {
    const [totalDiscussions, newDiscussions, previousPeriodNewDiscussions] = await Promise.all([
      this.discussionService.countTotal(),
      this.discussionService.countByDateRange(periods.current.start, periods.current.end),
      this.discussionService.countByDateRange(periods.previous.start, periods.previous.end),
    ]);

    return {
      total: totalDiscussions,
      new: newDiscussions,
      change: this.calculatePercentageChange(newDiscussions, previousPeriodNewDiscussions),
    };
  }

  private async getReportStats(periods: PeriodRanges): Promise<any> {
    const [activeReports, previousPeriodReports] = await Promise.all([
      this.reportService.countByStatus(ReportStatus.PENDING),
      this.reportService.countByDateRange(ReportStatus.PENDING, periods.previous.start, periods.previous.end),
    ]);

    return {
      active: activeReports,
      new: activeReports - previousPeriodReports,
      change: this.calculatePercentageChange(activeReports, previousPeriodReports),
    };
  }

  private async getEngagementStats(periods: PeriodRanges): Promise<any> {
    const [currentPeriodComments, currentPeriodVotes, previousPeriodComments, previousPeriodVotes, totalUsers] =
      await Promise.all([
        this.commentService.countByDateRange(periods.current.start, periods.current.end),
        this.voteService.getVoteCountByDateRange(periods.current.start, periods.current.end),
        this.commentService.countByDateRange(periods.previous.start, periods.previous.end),
        this.voteService.getVoteCountByDateRange(periods.previous.start, periods.previous.end),
        this.userService.getTotalUserCount(),
      ]);

    // Calculate engagement rates
    const denominator = totalUsers || 1;
    const currentEngagementRate = parseFloat(((currentPeriodComments + currentPeriodVotes) / denominator).toFixed(2));
    const previousEngagementRate = parseFloat(
      ((previousPeriodComments + previousPeriodVotes) / denominator).toFixed(2),
    );

    return {
      rate: currentEngagementRate,
      interactions: currentPeriodComments + currentPeriodVotes,
      change: this.calculatePercentageChange(currentEngagementRate, previousEngagementRate),
    };
  }
}
