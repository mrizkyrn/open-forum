import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { Report, ReportStatus, ReportTargetType } from './entities/report.entity';
import { ReportReason } from './entities/report-reason.entity';
import { User } from '../user/entities/user.entity';
import { Pageable } from '../../common/interfaces/pageable.interface';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportStatusDto } from './dto/update-report-status.dto';
import { SearchReportDto } from './dto/search-report.dto';
import { DiscussionService } from '../discussion/discussion.service';
import { CommentService } from '../comment/comment.service';
import { PageableReportResponseDto, ReportReasonResponseDto, ReportResponseDto } from './dto/report-response.dto';
import { NotificationService } from '../notification/notification.service';
import { WebsocketGateway } from 'src/core/websocket/websocket.gateway';
import { NotificationEntityType, NotificationType } from '../notification/entities/notification.entity';

@Injectable()
export class ReportService {
  constructor(
    @InjectRepository(Report)
    private readonly reportRepository: Repository<Report>,
    @InjectRepository(ReportReason)
    private readonly reasonRepository: Repository<ReportReason>,
    private readonly discussionService: DiscussionService,
    private readonly commentService: CommentService,
    private readonly notificationService: NotificationService,
    private readonly websocketGateway: WebsocketGateway,
  ) {}

  async createReport(createReportDto: CreateReportDto, currentUser: User): Promise<ReportResponseDto> {
    // Validate report reason exists
    const reason = await this.reasonRepository.findOne({
      where: { id: createReportDto.reasonId, isActive: true },
    });

    if (!reason) {
      throw new BadRequestException('Invalid report reason');
    }

    // Validate target entity exists
    await this.validateTargetExists(createReportDto.targetType, createReportDto.targetId, currentUser.id);

    // Check if user already reported this content
    const existingReport = await this.reportRepository.findOne({
      where: {
        reporterId: currentUser.id,
        targetType: createReportDto.targetType,
        targetId: createReportDto.targetId,
      },
    });

    if (existingReport) {
      throw new BadRequestException('You have already reported this content');
    }

    // Create the report
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

    return this.formatResponse(report);
  }

  async findAll(searchDto: SearchReportDto, currentUser: User): Promise<Pageable<ReportResponseDto>> {
    const { page = 1, limit = 10, sortBy, sortOrder, status, targetType } = searchDto;
    const offset = (page - 1) * limit;

    // Build query
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

    const [reports, totalItems] = await queryBuilder.getManyAndCount();

    // Load target entity details for each report
    for (const report of reports) {
      await this.populateTargetDetails(report);
    }

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalItems / limit);

    return {
      items: reports.map(report => this.formatResponse(report)),
      meta: {
        totalItems,
        itemsPerPage: limit,
        currentPage: page,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findById(id: number, currentUser: User): Promise<ReportResponseDto> {
    const report = await this.reportRepository.findOne({
      where: { id },
      relations: ['reporter', 'reviewer', 'reason'],
    });

    if (!report) {
      throw new NotFoundException(`Report with ID ${id} not found`);
    }

    // Check permissions: only admins, moderators, or the report creator can view it
    if (currentUser.role !== 'admin' && report.reporterId !== currentUser.id) {
      throw new ForbiddenException('You do not have permission to view this report');
    }

    // Populate target details
    await this.populateTargetDetails(report);

    return this.formatResponse(report);
  }

  async updateStatus(id: number, updateDto: UpdateReportStatusDto, currentUser: User): Promise<ReportResponseDto> {
    // Validate report status
    const report = await this.reportRepository.findOne({
      where: { id },
      relations: ['reporter', 'reason'],
    });

    if (!report) {
      throw new NotFoundException(`Report with ID ${id} not found`);
    }

    // Update status and reviewer info
    report.status = updateDto.status;
    report.reviewerId = currentUser.id;
    report.reviewedAt = new Date();

    // Save the updated report
    const updatedReport = await this.reportRepository.save(report);

    // Populate target details
    await this.populateTargetDetails(updatedReport);

    await this.createReportStatusNotification(report, currentUser);


    return this.formatResponse(updatedReport);
  }

  async getReportReasons(): Promise<ReportReasonResponseDto[]> {
    const reasons = await this.reasonRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
    
    return reasons.map(reason => ({
      id: reason.id,
      name: reason.name,
      description: reason.description,
      isActive: reason.isActive,
      createdAt: reason.createdAt,
      updatedAt: reason.updatedAt,
    }));
  }

  async getReportStats(currentUser: User): Promise<{
    total: number;
    pending: number;
    resolved: number;
    dismissed: number;
  }> {
    // Only admins and moderators can see stats for all reports
    // Regular users get stats for their own reports
    const where: FindOptionsWhere<Report> = {};

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
        const discussion = await this.discussionService.findById(report.targetId);
        report['targetDetails'] = {
          content: discussion.content,
          author: discussion.author,
          createdAt: discussion.createdAt,
        };
      } else if (report.targetType === ReportTargetType.COMMENT) {
        const comment = await this.commentService.findById(report.targetId);
        report['targetDetails'] = {
          content: comment.content,
          author: comment.author,
          createdAt: comment.createdAt,
        };
      }
    } catch (error) {
      // If the target has been deleted, set details to indicate this
      report['targetDetails'] = { deleted: true };
    }
  }

  private formatResponse(report: Report): ReportResponseDto {
    return {
      id: report.id,
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
      reporter: report.reporter && {
        id: report.reporter.id,
        username: report.reporter.username,
        fullName: report.reporter.fullName,
        role: report.reporter.role,
        avatarUrl: report.reporter.avatarUrl || null,
        createdAt: report.reporter.createdAt,
        updatedAt: report.reporter.updatedAt,
      },
      targetType: report.targetType,
      targetId: report.targetId,
      targetDetails: report['targetDetails'] || { deleted: true },
      reason: report.reason && {
        id: report.reason.id,
        name: report.reason.name,
        description: report.reason.description,
      },
      description: report.description,
      status: report.status,
      reviewer: report.reviewer && {
        id: report.reviewer.id,
        username: report.reviewer.username,
        fullName: report.reviewer.fullName,
        role: report.reviewer.role,
        avatarUrl: report.reviewer.avatarUrl || null,
        createdAt: report.reviewer.createdAt,
        updatedAt: report.reviewer.updatedAt,
      },
      reviewedAt: report.reviewedAt || undefined,
    };
  }

  private async createReportStatusNotification(report: Report, reviewer: User): Promise<void> {
    try {
      // Get content details for better notification context
      let content = '';
      let discussionId: number | null = null;
      let targetAuthorId: number | null = null;
      
      // Get the author of the reported content
      if (report.targetType === ReportTargetType.DISCUSSION) {
        try {
          const discussion = await this.discussionService.findById(report.targetId);
          if (discussion) {
            discussionId = discussion.id;
            content =  discussion.content.substring(0, 50) + (discussion.content.length > 50 ? '...' : '');
            targetAuthorId = discussion.author?.id || null;
          }
        } catch (error) {
          console.log('Discussion may have been deleted');
        }
      } else if (report.targetType === ReportTargetType.COMMENT) {
        try {
          const comment = await this.commentService.findById(report.targetId);
          if (comment) {
            discussionId = comment.discussionId;
            content = comment.content.substring(0, 50) + (comment.content.length > 50 ? '...' : '');
            targetAuthorId = comment.author.id;
          }
        } catch (error) {
          console.log('Comment may have been deleted');
        }
      }
  
      // Get a human-readable status
      const statusLabel = this.getStatusLabel(report.status);
  
      // 1. Create notification for the REPORTER
      const reporterNotification = await this.notificationService.createNotification(
        report.reporterId,              // recipient
        reviewer.id,                    // actor (the admin/moderator)
        NotificationType.REPORT_STATUS_UPDATE,
        NotificationEntityType.REPORT,
        report.id,
        {
          status: report.status,
          statusLabel,
          targetType: report.targetType,
          targetId: report.targetId,
          reasonId: report.reasonId,
          reasonText: report.reason?.name || '',
          content,
          discussionId,
          recipientType: 'reporter' // Indicates this notification is for the reporter
        }
      );
  
      // Send real-time notification to reporter
      this.websocketGateway.sendNotification(report.reporterId, {
        id: reporterNotification.id,
        type: reporterNotification.type,
        entityType: reporterNotification.entityType,
        entityId: reporterNotification.entityId,
        data: reporterNotification.data,
        createdAt: reporterNotification.createdAt,
        isRead: false,
        actor: {
          id: reviewer.id,
          username: reviewer.username,
          fullName: reviewer.fullName,
          avatarUrl: reviewer.avatarUrl,
        },
      });
  
      // 2. Create notification for the CONTENT AUTHOR if we found them 
      // and only if the report was actioned (resolved or specific action taken)
      if (targetAuthorId && report.status === ReportStatus.RESOLVED) {
        const targetAuthorNotification = await this.notificationService.createNotification(
          targetAuthorId,               // recipient
          reviewer.id,                  // actor (the admin/moderator)
          NotificationType.CONTENT_MODERATION,
          NotificationEntityType.REPORT,
          report.id,
          {
            status: report.status,
            statusLabel,
            targetType: report.targetType,
            targetId: report.targetId,
            content,
            discussionId,
            recipientType: 'content_author' // Indicates this notification is for the content author
          }
        );
  
        // Send real-time notification to content author
        this.websocketGateway.sendNotification(targetAuthorId, {
          id: targetAuthorNotification.id,
          type: targetAuthorNotification.type,
          entityType: targetAuthorNotification.entityType,
          entityId: targetAuthorNotification.entityId,
          data: targetAuthorNotification.data,
          createdAt: targetAuthorNotification.createdAt,
          isRead: false,
          actor: {
            id: reviewer.id,
            username: reviewer.username,
            fullName: reviewer.fullName,
            avatarUrl: reviewer.avatarUrl,
          },
        });
      }
    } catch (error) {
      console.error('Failed to create report status notification:', error);
      // Non-critical failure - don't throw the error
    }
  }

  /**
   * Get human-readable status label
   */
  private getStatusLabel(status: ReportStatus): string {
    switch (status) {
      case ReportStatus.RESOLVED:
        return 'Resolved';
      case ReportStatus.DISMISSED:
        return 'Dismissed';
      case ReportStatus.PENDING:
        return 'Pending';
      default:
        return 'Updated';
    }
  }
}
