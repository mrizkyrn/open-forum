import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { User } from '../user/entities/user.entity';
import { Discussion } from '../discussion/entities/discussion.entity';
import { Comment } from '../comment/entities/comment.entity';
import { Report, ReportStatus } from '../report/entities/report.entity';
import { Vote } from '../vote/entities/vote.entity';
import { subDays, startOfDay } from 'date-fns';
import { UserService } from '../user/user.service';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { UserResponseDto } from '../user/dto/user-response.dto';
import { UpdateUserDto } from '../user/dto/update-user.dto';
import { UserRole } from 'src/common/enums/user-role.enum';
import { ReportService } from '../report/report.service';
import { UpdateReportStatusDto } from '../report/dto/update-report-status.dto';
import { ReportResponseDto } from '../report/dto/report-response.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Discussion)
    private readonly discussionRepository: Repository<Discussion>,
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    @InjectRepository(Report)
    private readonly reportRepository: Repository<Report>,
    @InjectRepository(Vote)
    private readonly voteRepository: Repository<Vote>,
    private readonly userService: UserService,
    private readonly reportService: ReportService,
  ) {}

  /**
   * Get dashboard statistics with configurable time periods
   * @param currentPeriod - Time period to analyze (default: 'day')
   * @param comparisonPeriod - Period type for comparison (default: same as currentPeriod)
   */
  async getDashboardStats(
    currentPeriod: 'day' | 'week' | 'month' = 'day',
    comparisonPeriod?: 'day' | 'week' | 'month',
  ) {
    try {
      // Use the provided comparison period or default to the current period type
      comparisonPeriod = comparisonPeriod || currentPeriod;

      const now = new Date();

      // Calculate period ranges based on parameters
      const periods = this.calculatePeriodRanges(now, currentPeriod, comparisonPeriod);

      // Get user stats
      const [totalUsers, newUsers, previousPeriodNewUsers, activeUsers] = await Promise.all([
        this.userRepository.count(),
        this.userRepository.count({
          where: { createdAt: Between(periods.current.start, periods.current.end) },
        }),
        this.userRepository.count({
          where: { createdAt: Between(periods.previous.start, periods.previous.end) },
        }),
        this.userRepository
          .createQueryBuilder('user')
          .where(`user.last_active_at >= :startDate`, { startDate: periods.current.start })
          .getCount(),
      ]);

      // Get discussion stats
      const [totalDiscussions, newDiscussions, previousPeriodNewDiscussions] = await Promise.all([
        this.discussionRepository.count(),
        this.discussionRepository.count({
          where: { createdAt: Between(periods.current.start, periods.current.end) },
        }),
        this.discussionRepository.count({
          where: { createdAt: Between(periods.previous.start, periods.previous.end) },
        }),
      ]);

      // Get report stats
      const [activeReports, previousPeriodReports] = await Promise.all([
        this.reportRepository.count({ where: { status: ReportStatus.PENDING } }),
        this.reportRepository.count({
          where: {
            status: ReportStatus.PENDING,
            createdAt: Between(periods.previous.start, periods.previous.end),
          },
        }),
      ]);

      // Get engagement metrics
      const [currentPeriodComments, currentPeriodVotes] = await Promise.all([
        this.commentRepository.count({
          where: { createdAt: Between(periods.current.start, periods.current.end) },
        }),
        this.voteRepository.count({
          where: { createdAt: Between(periods.current.start, periods.current.end) },
        }),
      ]);

      const [previousPeriodComments, previousPeriodVotes] = await Promise.all([
        this.commentRepository.count({
          where: { createdAt: Between(periods.previous.start, periods.previous.end) },
        }),
        this.voteRepository.count({
          where: { createdAt: Between(periods.previous.start, periods.previous.end) },
        }),
      ]);

      // Calculate engagement rates
      const denominator = totalUsers || 1;
      const currentEngagementRate = parseFloat(((currentPeriodComments + currentPeriodVotes) / denominator).toFixed(2));
      const previousEngagementRate = parseFloat(
        ((previousPeriodComments + previousPeriodVotes) / denominator).toFixed(2),
      );

      // Helper function to calculate percentage change
      const calculateChange = (current: number, previous: number): number => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return Math.round(((current - previous) / previous) * 100);
      };

      return {
        users: {
          total: totalUsers,
          new: newUsers,
          active: activeUsers,
          change: calculateChange(newUsers, previousPeriodNewUsers),
        },
        discussions: {
          total: totalDiscussions,
          new: newDiscussions,
          change: calculateChange(newDiscussions, previousPeriodNewDiscussions),
        },
        reports: {
          active: activeReports,
          new: activeReports - previousPeriodReports,
          change: calculateChange(activeReports, previousPeriodReports),
        },
        engagement: {
          rate: currentEngagementRate,
          interactions: currentPeriodComments + currentPeriodVotes,
          change: calculateChange(currentEngagementRate, previousEngagementRate),
        },
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
      console.error('Error calculating dashboard stats:', error);
      throw new Error('Failed to retrieve dashboard statistics');
    }
  }

  /**
   * Calculate start and end dates for current and previous periods
   * @param now - Current date
   * @param currentPeriod - Current period type
   * @param comparisonPeriod - Comparison period type
   */
  private calculatePeriodRanges(
    now: Date,
    currentPeriod: 'day' | 'week' | 'month',
    comparisonPeriod: 'day' | 'week' | 'month',
  ) {
    let currentStart: Date;
    let previousStart: Date;

    // Set current period start date
    switch (currentPeriod) {
      case 'day':
        currentStart = startOfDay(subDays(now, 1));
        break;
      case 'week':
        currentStart = startOfDay(subDays(now, 7));
        break;
      case 'month':
        currentStart = startOfDay(subDays(now, 30));
        break;
    }

    // Set previous period start date based on comparison period
    switch (comparisonPeriod) {
      case 'day':
        previousStart = subDays(currentStart, 1);
        break;
      case 'week':
        previousStart = subDays(currentStart, 7);
        break;
      case 'month':
        previousStart = subDays(currentStart, 30);
        break;
    }

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

  /**
   * Get activity data for time range
   */
  async getActivityData(timeRange: 'day' | 'week' | 'month' = 'week') {
    const today = new Date();
    let startDate: Date;

    // Determine date range based on time range parameter
    switch (timeRange) {
      case 'day':
        startDate = subDays(today, 1);
        break;
      case 'week':
        startDate = subDays(today, 7);
        break;
      case 'month':
        startDate = subDays(today, 30);
        break;
      default:
        startDate = subDays(today, 7);
    }

    // Prepare query results for each entity
    const discussionsPromise = this.getTimeSeries('discussions', startDate, today);

    const commentsPromise = this.getTimeSeries('comments', startDate, today);

    const usersPromise = this.getTimeSeries('users', startDate, today);

    const votesPromise = this.getTimeSeries('votes', startDate, today);

    // Await all promises
    const [discussions, comments, users, votes] = await Promise.all([
      discussionsPromise,
      commentsPromise,
      usersPromise,
      votesPromise,
    ]);

    // Format the data for the frontend
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
    };
  }

  /**
   * Helper method to get time series data for different entities
   */
  private async getTimeSeries(entity: 'discussions' | 'comments' | 'users' | 'votes', startDate: Date, endDate: Date) {
    let repository: Repository<any>;

    // Select the appropriate repository
    switch (entity) {
      case 'discussions':
        repository = this.discussionRepository;
        break;
      case 'comments':
        repository = this.commentRepository;
        break;
      case 'users':
        repository = this.userRepository;
        break;
      case 'votes':
        repository = this.voteRepository;
        break;
      default:
        throw new BadRequestException('Invalid entity type');
    }

    // Get creation dates for the entity in the time range
    const results = await repository
      .createQueryBuilder(entity)
      .select(`DATE(${entity}.created_at)`, 'date')
      .addSelect(`COUNT(${entity}.id)`, 'count')
      .where(`${entity}.created_at BETWEEN :start AND :end`, {
        start: startDate,
        end: endDate,
      })
      .groupBy(`DATE(${entity}.created_at)`)
      .orderBy(`DATE(${entity}.created_at)`, 'ASC')
      .getRawMany();

    // Format the results
    return results.map((item) => ({
      date: item.date,
      value: parseInt(item.count, 10),
    }));
  }

  // User management methods
  async createUser(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    return await this.userService.create(createUserDto);
  }

  async updateUser(id: number, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    return await this.userService.update(id, updateUserDto);
  }

  async deleteUser(id: number, currentUserId: number): Promise<void> {
    await this.userService.delete(id, currentUserId);
  }

  async changeUserRole(id: number, role: UserRole, adminId: number): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === role) {
      throw new BadRequestException('User already has the specified role');
    }

    if (user.id === adminId) {
      throw new ForbiddenException('Cannot change role for own account');
    }

    user.role = role;
    await this.userRepository.save(user);

    return UserResponseDto.fromEntity(user);
  }

  // Report management methods
  async updateReportStatus(
    id: number,
    updateStatusDto: UpdateReportStatusDto,
    currentUser: User,
  ): Promise<ReportResponseDto> {
    return await this.reportService.updateStatus(id, updateStatusDto, currentUser);
  }
}
