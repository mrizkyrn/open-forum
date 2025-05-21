import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { WebsocketGateway } from 'src/core/websocket/websocket.gateway';
import { Between, FindOptionsWhere, Repository } from 'typeorm';
import { Pageable } from '../../common/interfaces/pageable.interface';
import { AnalyticService } from '../analytic/analytic.service';
import { ActivityEntityType, ActivityType } from '../analytic/entities/user-activity.entity';
import { CommentService } from '../comment/comment.service';
import { DiscussionService } from '../discussion/discussion.service';
import { NotificationEntityType, NotificationType } from '../notification/entities/notification.entity';
import { NotificationService } from '../notification/notification.service';
import { User } from '../user/entities/user.entity';
import { CreateReportDto } from './dto/create-report.dto';
import { HandleReportDto } from './dto/handle-report.dto';
import { ReportReasonResponseDto, ReportResponseDto, ReportStatsResponseDto } from './dto/report-response.dto';
import { SearchReportDto } from './dto/search-report.dto';
import { ReportReason } from './entities/report-reason.entity';
import { Report, ReportStatus, ReportTargetType } from './entities/report.entity';

@Injectable()
export class ReportService {
  private readonly logger = new Logger(ReportService.name);

  constructor(
    @InjectRepository(Report)
    private readonly reportRepository: Repository<Report>,
    @InjectRepository(ReportReason)
    private readonly reasonRepository: Repository<ReportReason>,
    private readonly discussionService: DiscussionService,
    private readonly commentService: CommentService,
    private readonly notificationService: NotificationService,
    private readonly analyticService: AnalyticService,
    private readonly websocketGateway: WebsocketGateway,
  ) {}

  // ----- Report CRUD Operations -----

  async createReport(createReportDto: CreateReportDto, currentUser: User): Promise<ReportResponseDto> {
    try {
      await this.getActiveReasonById(createReportDto.reasonId);
      await this.validateTargetExists(createReportDto.targetType, createReportDto.targetId, currentUser.id);
      await this.checkForExistingReport(currentUser.id, createReportDto.targetType, createReportDto.targetId);

      const newReport = this.reportRepository.create({
        reporterId: currentUser.id,
        targetType: createReportDto.targetType,
        targetId: createReportDto.targetId,
        reasonId: createReportDto.reasonId,
        description: createReportDto.description,
        status: ReportStatus.PENDING,
      });

      const report = await this.reportRepository.save(newReport);
      await this.populateTargetDetails(report);

      await this.websocketGateway.notifyNewReportToAdmins({
        id: report.id,
        targetType: report.targetType,
        targetId: report.targetId,
        reasonId: report.reasonId,
        description: report.description,
        status: report.status,
        createdAt: report.createdAt,
      });

      await this.analyticService.recordActivity(
        currentUser.id,
        ActivityType.REPORT_CONTENT,
        ActivityEntityType.REPORT,
        report.id,
        { targetType: report.targetType, targetId: report.targetId },
      );

      return ReportResponseDto.fromEntity(report);
    } catch (error) {
      this.logger.error(`Error creating report: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findAll(searchDto: SearchReportDto, currentUser: User): Promise<Pageable<ReportResponseDto>> {
    try {
      const { page, limit } = searchDto;
      const offset = (page - 1) * limit;

      const queryBuilder = this.buildReportSearchQuery(searchDto, offset, limit, currentUser);
      const [reports, totalItems] = await queryBuilder.getManyAndCount();

      // Load target entity details for each report
      for (const report of reports) {
        await this.populateTargetDetails(report);
      }

      // Calculate pagination metadata
      const totalPages = Math.ceil(totalItems / limit);

      return {
        items: reports.map((report) => ReportResponseDto.fromEntity(report)),
        meta: {
          totalItems,
          itemsPerPage: limit,
          currentPage: page,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      };
    } catch (error) {
      this.logger.error(`Error fetching reports: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findById(id: number, currentUser: User): Promise<ReportResponseDto> {
    try {
      const report = await this.getReportById(id);

      this.validateReportAccess(report, currentUser);
      await this.populateTargetDetails(report);

      return ReportResponseDto.fromEntity(report);
    } catch (error) {
      this.logger.error(`Error fetching report: ${error.message}`, error.stack);
      throw error;
    }
  }

  async handleReport(id: number, handleDto: HandleReportDto, admin: User): Promise<ReportResponseDto> {
    try {
      // Get the report with related entities
      const report = await this.getReportById(id);

      // Verify admin permissions
      if (admin.role !== 'admin') {
        throw new ForbiddenException('Only administrators can handle reports');
      }

      // Get content details before any potential deletion
      const contentDetails = await this.getReportContentDetails(report);
      const { content, discussionId, targetAuthorId } = contentDetails;

      // Delete content if requested
      if (handleDto.deleteContent) {
        await this.deleteReportTarget(report.targetType, report.targetId);
      }

      // Update report status
      report.status = handleDto.status;
      report.reviewerId = admin.id;
      report.reviewedAt = new Date();

      // Save the updated report
      const updatedReport = await this.reportRepository.save(report);

      // Send appropriate notifications using the unified method
      await this.createReportNotification({
        report: updatedReport,
        targetAuthorId,
        contentPreview: content,
        discussionId,
        isContentDeleted: handleDto.deleteContent,
        options: {
          note: handleDto.note,
          notifyReporter: handleDto.notifyReporter,
          notifyAuthor: handleDto.notifyAuthor,
        },
      });

      // Update response based on action taken
      if (handleDto.deleteContent) {
        updatedReport['targetDetails'] = { deleted: true };
      } else {
        await this.populateTargetDetails(updatedReport);
      }

      return ReportResponseDto.fromEntity(updatedReport);
    } catch (error) {
      this.logger.error(`Error handling report: ${error.message}`, error.stack);
      throw error;
    }
  }
  // ----- Report Reason Operations -----

  async getReportReasons(): Promise<ReportReasonResponseDto[]> {
    try {
      const reasons = await this.reasonRepository.find({
        where: { isActive: true },
        order: { name: 'ASC' },
      });

      return reasons.map((reason) => ReportReasonResponseDto.fromEntity(reason));
    } catch (error) {
      this.logger.error(`Error fetching report reasons: ${error.message}`, error.stack);
      throw error;
    }
  }

  // ----- Statistics Operations -----

  async getReportStats(currentUser: User): Promise<ReportStatsResponseDto> {
    const where: FindOptionsWhere<Report> = {};

    try {
      // Regular users can only see their own reports
      if (currentUser.role !== 'admin') {
        where.reporterId = currentUser.id;
      }

      const [total, pending, resolved, dismissed] = await Promise.all([
        this.reportRepository.count({ where }),
        this.reportRepository.count({ where: { ...where, status: ReportStatus.PENDING } }),
        this.reportRepository.count({ where: { ...where, status: ReportStatus.RESOLVED } }),
        this.reportRepository.count({ where: { ...where, status: ReportStatus.DISMISSED } }),
      ]);

      return {
        total,
        pending,
        resolved,
        dismissed,
      };
    } catch (error) {
      this.logger.error(`Error fetching report stats: ${error.message}`, error.stack);
      throw error;
    }
  }

  // ----- Other Operations -----

  async countByStatus(status: ReportStatus): Promise<number> {
    return this.reportRepository.count({ where: { status } });
  }

  async countByDateRange(status: any, start: Date, end: Date): Promise<number> {
    return this.reportRepository.count({
      where: { status, createdAt: Between(start, end) },
    });
  }

  async getTimeSeries(start: Date, end: Date): Promise<{ date: string; count: string }[]> {
    return this.reportRepository
      .createQueryBuilder('report')
      .select(`DATE(report.createdAt)`, 'date')
      .addSelect(`COUNT(report.id)`, 'count')
      .where('report.createdAt BETWEEN :start AND :end', {
        start,
        end,
      })
      .groupBy(`DATE(report.createdAt)`)
      .orderBy(`DATE(report.createdAt)`, 'ASC')
      .getRawMany();
  }

  // ----- Helper Methods -----

  private async getReportById(id: number): Promise<Report> {
    const report = await this.reportRepository.findOne({
      where: { id },
      relations: ['reporter', 'reviewer', 'reason'],
    });

    if (!report) {
      throw new NotFoundException(`Report with ID ${id} not found`);
    }

    return report;
  }

  private validateReportAccess(report: Report, currentUser: User): void {
    if (currentUser.role !== 'admin' && report.reporterId !== currentUser.id) {
      throw new ForbiddenException('You do not have permission to view this report');
    }
  }

  private buildReportSearchQuery(searchDto: SearchReportDto, offset: number, limit: number, currentUser: User) {
    const { sortBy = 'createdAt', sortOrder = 'DESC', status, targetType } = searchDto;

    const queryBuilder = this.reportRepository
      .createQueryBuilder('report')
      .leftJoinAndSelect('report.reporter', 'reporter')
      .leftJoinAndSelect('report.reviewer', 'reviewer')
      .leftJoinAndSelect('report.reason', 'reason')
      .orderBy(`report.${sortBy}`, sortOrder)
      .skip(offset)
      .take(limit);

    // Apply filters
    if (status) {
      queryBuilder.andWhere('report.status = :status', { status });
    }

    if (targetType) {
      queryBuilder.andWhere('report.targetType = :targetType', { targetType });
    }

    // Regular users can only see their own reports
    if (currentUser.role !== 'admin') {
      queryBuilder.andWhere('report.reporterId = :userId', { userId: currentUser.id });
    }

    return queryBuilder;
  }

  private async getReportContentDetails(report: Report): Promise<{
    content: string;
    discussionId: number | null;
    targetAuthorId: number | null;
  }> {
    let content = '';
    let discussionId: number | null = null;
    let targetAuthorId: number | null = null;

    if (report.targetType === ReportTargetType.DISCUSSION) {
      try {
        const discussion = await this.discussionService.findById(report.targetId);
        if (discussion) {
          discussionId = discussion.id;
          content = discussion.content.substring(0, 50) + (discussion.content.length > 50 ? '...' : '');
          targetAuthorId = discussion.author?.id || null;
        }
      } catch (error) {
        this.logger.debug('Discussion may have been deleted');
      }
    } else if (report.targetType === ReportTargetType.COMMENT) {
      try {
        const comment = await this.commentService.findById(report.targetId);
        if (comment && comment.content) {
          discussionId = comment.discussionId;
          content = comment.content.substring(0, 50) + (comment.content.length > 50 ? '...' : '');
          targetAuthorId = comment.author.id;
        }
      } catch (error) {
        this.logger.debug('Comment may have been deleted');
      }
    }

    return { content, discussionId, targetAuthorId };
  }

  private async getActiveReasonById(id: number): Promise<ReportReason> {
    const reason = await this.reasonRepository.findOne({
      where: { id, isActive: true },
    });

    if (!reason) {
      throw new BadRequestException('Invalid report reason');
    }

    return reason;
  }

  private async checkForExistingReport(userId: number, targetType: ReportTargetType, targetId: number): Promise<void> {
    const existingReport = await this.reportRepository.findOne({
      where: {
        reporterId: userId,
        targetType,
        targetId,
      },
    });

    if (existingReport) {
      throw new BadRequestException('You have already reported this content');
    }
  }

  private async validateTargetExists(
    targetType: ReportTargetType,
    targetId: number,
    currentUserId: number,
  ): Promise<void> {
    try {
      if (targetType === ReportTargetType.DISCUSSION) {
        const discussion = await this.discussionService.findById(targetId);

        if (discussion.author?.id === currentUserId) {
          throw new BadRequestException('You cannot report your own discussion');
        }
      } else if (targetType === ReportTargetType.COMMENT) {
        const comment = await this.commentService.findById(targetId);

        if (comment.author.id === currentUserId) {
          throw new BadRequestException('You cannot report your own comment');
        }
      } else {
        throw new BadRequestException(`Invalid target type: ${targetType}`);
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new BadRequestException(`The reported ${targetType} does not exist`);
      }
      throw error;
    }
  }

  private async populateTargetDetails(report: Report): Promise<void> {
    try {
      if (report.targetType === ReportTargetType.DISCUSSION) {
        const discussion = await this.discussionService.getDiscussionEntity(report.targetId, ['author']);
        report['targetDetails'] = {
          content: discussion.content,
          author: {
            id: discussion.author.id,
            username: discussion.author.username,
            fullName: discussion.author.fullName,
            avatarUrl: discussion.author.avatarUrl,
          },
          createdAt: discussion.createdAt,
        };
      } else if (report.targetType === ReportTargetType.COMMENT) {
        const comment = await this.commentService.getCommentEntity(report.targetId, ['author']);
        report['targetDetails'] = {
          discussionId: comment.discussionId,
          content: comment.content,
          author: {
            id: comment.author.id,
            username: comment.author.username,
            fullName: comment.author.fullName,
            avatarUrl: comment.author.avatarUrl,
          },
          createdAt: comment.createdAt,
        };
      }
    } catch (error) {
      // If the target has been deleted, set details to indicate this
      report['targetDetails'] = { deleted: true };
    }
  }

  private async deleteReportTarget(targetType: ReportTargetType, targetId: number): Promise<void> {
    try {
      if (targetType === ReportTargetType.DISCUSSION) {
        await this.discussionService.delete(targetId);
        this.logger.log(`Deleted reported discussion #${targetId}`);
      } else if (targetType === ReportTargetType.COMMENT) {
        await this.commentService.delete(targetId);
        this.logger.log(`Deleted reported comment #${targetId}`);
      } else {
        throw new BadRequestException(`Unsupported target type: ${targetType}`);
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        this.logger.warn(`Content already deleted: ${targetType} #${targetId}`);
        return;
      }
      throw error;
    }
  }

  private async createReportNotification(params: {
    report: Report;
    targetAuthorId: number | null;
    contentPreview: string;
    discussionId: number | null;
    isContentDeleted: boolean;
    options: {
      note?: string;
      notifyReporter?: boolean;
      notifyAuthor?: boolean;
    };
  }): Promise<void> {
    const { report, targetAuthorId, contentPreview, discussionId, isContentDeleted, options } = params;
    const { note, notifyReporter = true, notifyAuthor = true } = options;

    try {
      const notifications: Promise<any>[] = [];

      // Common notification data
      const baseNotificationData = {
        reportId: report.id,
        discussionId,
        status: report.status,
        targetType: report.targetType,
        targetId: report.targetId,
        contentPreview,
        isContentDeleted,
        note: note || '',
        reasonText: report.reason?.name || '',
      };

      // 1. Notify content author if requested and if we have their ID
      if (targetAuthorId && notifyAuthor) {
        const authorMessage = this.getAuthorMessage(isContentDeleted, report.targetType);

        notifications.push(
          this.notificationService.createNotificationIfNotExists(
            {
              recipientId: targetAuthorId,
              actorId: report.reviewerId,
              type: NotificationType.REPORT_REVIEWED,
              entityType: NotificationEntityType.REPORT,
              entityId: report.id,
              data: {
                ...baseNotificationData,
                message: authorMessage,
                recipientType: 'content_author',
              },
            },
            10,
          ), // 10-minute deduplication window
        );
      }

      // 2. Notify reporter if requested and not the same as author
      if (notifyReporter && report.reporterId !== targetAuthorId) {
        const reporterMessage = this.getReporterMessage(isContentDeleted);

        notifications.push(
          this.notificationService.createNotificationIfNotExists(
            {
              recipientId: report.reporterId,
              actorId: report.reviewerId,
              type: NotificationType.REPORT_REVIEWED,
              entityType: NotificationEntityType.REPORT,
              entityId: report.id,
              data: {
                ...baseNotificationData,
                message: reporterMessage,
                recipientType: 'reporter',
              },
            },
            10,
          ), // 10-minute deduplication window
        );
      }

      // Execute all notification promises in parallel
      if (notifications.length > 0) {
        await Promise.all(notifications);
      }
    } catch (error) {
      this.logger.error(`Error sending report notifications: ${error.message}`, error.stack);
      // Non-critical failure - don't throw the error
    }
  }

  private getAuthorMessage(isContentDeleted: boolean, contentType: string): string {
    return isContentDeleted
      ? `Your ${contentType} has been removed for violating our community guidelines.`
      : `Your ${contentType} was reported and has been reviewed by our moderators.`;
  }

  private getReporterMessage(isContentDeleted: boolean): string {
    return isContentDeleted
      ? 'Thank you for your report. The content has been removed.'
      : 'Your report has been reviewed.';
  }
}
