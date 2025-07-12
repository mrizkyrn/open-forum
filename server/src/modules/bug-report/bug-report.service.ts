import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { UserRole } from '../../common/enums/user-role.enum';
import { Pageable } from '../../common/interfaces/pageable.interface';
import { User } from '../user/entities/user.entity';
import {
  BugReportResponseDto,
  CreateBugReportDto,
  SearchBugReportDto,
  UpdateBugReportDto,
  UpdateBugReportStatusDto,
} from './dto';
import { BugReport, BugStatus } from './entities/bug-report.entity';

@Injectable()
export class BugReportService {
  private readonly logger = new Logger(BugReportService.name);

  constructor(
    @InjectRepository(BugReport)
    private readonly bugReportRepository: Repository<BugReport>,
  ) {}

  /**
   * Create a new bug report
   * @param createBugReportDto - Bug report creation data
   * @param reporter - User who is reporting the bug
   * @returns Created bug report
   */
  async create(createBugReportDto: CreateBugReportDto, reporter: User): Promise<BugReportResponseDto> {
    this.logger.log(`Creating new bug report with title: ${createBugReportDto.title}`);

    const newBugReport = this.bugReportRepository.create({
      ...createBugReportDto,
      reporterId: reporter.id,
      status: BugStatus.OPEN,
    });

    const savedBugReport = await this.bugReportRepository.save(newBugReport);
    this.logger.log(`Successfully created bug report with ID: ${savedBugReport.id}`);

    return this.findById(savedBugReport.id);
  }

  /**
   * Find all bug reports with pagination and filtering
   * @param searchDto - Search and pagination parameters
   * @param currentUser - Current authenticated user for filtering
   * @returns Paginated list of bug reports
   */
  async findAll(searchDto: SearchBugReportDto, currentUser: User): Promise<Pageable<BugReportResponseDto>> {
    this.logger.debug(`Finding bug reports with search params: ${JSON.stringify(searchDto)}`);

    const { page, limit } = searchDto;
    const offset = (page - 1) * limit;

    const queryBuilder = this.buildBugReportSearchQuery(searchDto, offset, limit, currentUser);
    const [bugReports, totalItems] = await queryBuilder.getManyAndCount();

    const result = this.createPaginatedResponse(bugReports, totalItems, page, limit);

    this.logger.debug(`Found ${bugReports.length} bug reports out of ${totalItems} total`);
    return result;
  }

  /**
   * Find bug report by ID
   * @param id - Bug report ID
   * @returns Bug report details
   * @throws NotFoundException if bug report not found
   */
  async findById(id: number): Promise<BugReportResponseDto> {
    this.logger.debug(`Finding bug report by ID: ${id}`);

    const bugReport = await this.getBugReportEntityById(id);
    return BugReportResponseDto.fromEntity(bugReport);
  }

  /**
   * Update a bug report
   * @param id - Bug report ID
   * @param updateBugReportDto - Update data
   * @param currentUser - Current authenticated user
   * @returns Updated bug report
   * @throws NotFoundException if bug report not found
   * @throws ForbiddenException if user doesn't have permission
   */
  async update(id: number, updateBugReportDto: UpdateBugReportDto, currentUser: User): Promise<BugReportResponseDto> {
    this.logger.log(`Updating bug report with ID: ${id}`);

    const bugReport = await this.getBugReportEntityById(id);

    // Check permissions - only admin or reporter can update
    if (currentUser.role !== UserRole.ADMIN && bugReport.reporterId !== currentUser.id) {
      throw new ForbiddenException('You can only update your own bug reports');
    }

    // Check status restrictions - non-admin users cannot update resolved or closed bug reports
    if (currentUser.role !== UserRole.ADMIN && [BugStatus.RESOLVED, BugStatus.CLOSED].includes(bugReport.status)) {
      throw new ForbiddenException('Cannot update bug reports that are already resolved or closed');
    }

    // If user is not admin, restrict certain updates
    if (currentUser.role !== UserRole.ADMIN) {
      if (updateBugReportDto.status) {
        delete updateBugReportDto.status;
      }
      if (updateBugReportDto.resolution) {
        delete updateBugReportDto.resolution;
      }
    }

    Object.assign(bugReport, updateBugReportDto);
    await this.bugReportRepository.save(bugReport);

    this.logger.log(`Successfully updated bug report with ID: ${id}`);
    return this.findById(id);
  }

  /**
   * Delete a bug report
   * @param id - Bug report ID
   * @param currentUser - Current authenticated user
   * @throws NotFoundException if bug report not found
   * @throws ForbiddenException if user doesn't have permission
   */
  async remove(id: number, currentUser: User): Promise<void> {
    this.logger.log(`Deleting bug report with ID: ${id}`);

    const bugReport = await this.getBugReportEntityById(id);

    // Check permissions - only admin or reporter can delete
    if (currentUser.role !== UserRole.ADMIN && bugReport.reporterId !== currentUser.id) {
      throw new ForbiddenException('You can only delete your own bug reports');
    }

    await this.bugReportRepository.remove(bugReport);
    this.logger.log(`Successfully deleted bug report with ID: ${id}`);
  }

  /**
   * Assign a bug report to a user (admin only)
   * @param id - Bug report ID
   * @param assignedToId - User ID to assign to
   * @param currentUser - Current authenticated user
   * @returns Updated bug report
   * @throws NotFoundException if bug report not found
   * @throws ForbiddenException if user is not admin
   */
  async assignBugReport(id: number, assignedToId: number | null, currentUser: User): Promise<BugReportResponseDto> {
    this.logger.log(`Assigning bug report ${id} to user ${assignedToId}`);

    if (currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can assign bug reports');
    }

    const bugReport = await this.getBugReportEntityById(id);
    bugReport.assignedToId = assignedToId;

    // Auto-update status if being assigned
    if (assignedToId && bugReport.status === BugStatus.OPEN) {
      bugReport.status = BugStatus.IN_PROGRESS;
    }

    await this.bugReportRepository.save(bugReport);

    this.logger.log(`Successfully assigned bug report ${id} to user ${assignedToId}`);
    return this.findById(id);
  }

  /**
   * Update bug report status
   * @param id - Bug report ID
   * @param updateStatusDto - Status update data
   * @param currentUser - Current authenticated user
   * @returns Updated bug report
   * @throws NotFoundException if bug report not found
   * @throws ForbiddenException if user doesn't have permission
   * @throws BadRequestException if resolution is required but not provided
   */
  async updateStatus(
    id: number,
    updateStatusDto: UpdateBugReportStatusDto,
    currentUser: User,
  ): Promise<BugReportResponseDto> {
    this.logger.log(`Updating status of bug report ${id} to ${updateStatusDto.status}`);

    const bugReport = await this.getBugReportEntityById(id);

    // Check permissions
    // - Admins can update any bug report status
    // - Assigned users can update status of their assigned reports
    // - Reporters can only mark as resolved if they're the reporter
    const canUpdateStatus =
      currentUser.role === UserRole.ADMIN ||
      bugReport.assignedToId === currentUser.id ||
      (bugReport.reporterId === currentUser.id && updateStatusDto.status === BugStatus.RESOLVED);

    if (!canUpdateStatus) {
      throw new ForbiddenException('You do not have permission to update this bug report status');
    }

    // Validate resolution requirement for resolved/closed status
    if ([BugStatus.RESOLVED, BugStatus.CLOSED].includes(updateStatusDto.status)) {
      if (!updateStatusDto.resolution && !bugReport.resolution) {
        throw new BadRequestException('Resolution is required when marking bug report as resolved or closed');
      }
    }

    // Update the bug report
    bugReport.status = updateStatusDto.status;
    if (updateStatusDto.resolution) {
      bugReport.resolution = updateStatusDto.resolution;
    }

    await this.bugReportRepository.save(bugReport);

    this.logger.log(`Successfully updated status of bug report ${id} to ${updateStatusDto.status}`);
    return this.findById(id);
  }

  // ==================== PRIVATE HELPER METHODS ====================

  /**
   * Get bug report entity by ID
   * @param id - Bug report ID
   * @returns Bug report entity
   * @throws NotFoundException if not found
   */
  private async getBugReportEntityById(id: number): Promise<BugReport> {
    const bugReport = await this.bugReportRepository.findOne({
      where: { id },
      relations: ['reporter', 'assignedTo'],
    });

    if (!bugReport) {
      throw new NotFoundException(`Bug report with ID ${id} not found`);
    }

    return bugReport;
  }

  /**
   * Build search query for bug reports
   */
  private buildBugReportSearchQuery(
    searchDto: SearchBugReportDto,
    offset: number,
    limit: number,
    currentUser: User,
  ): SelectQueryBuilder<BugReport> {
    const queryBuilder = this.bugReportRepository
      .createQueryBuilder('bugReport')
      .leftJoinAndSelect('bugReport.reporter', 'reporter')
      .leftJoinAndSelect('bugReport.assignedTo', 'assignedTo')
      .skip(offset)
      .take(limit);

    // Apply sorting
    if (searchDto.sortBy) {
      const sortField = `bugReport.${searchDto.sortBy}`;
      queryBuilder.orderBy(sortField, searchDto.sortOrder || 'DESC');
    } else {
      queryBuilder.orderBy('bugReport.createdAt', 'DESC');
    }

    // Apply search filters
    if (searchDto.search) {
      queryBuilder.andWhere(
        '(LOWER(bugReport.title) LIKE LOWER(:search) OR LOWER(bugReport.description) LIKE LOWER(:search))',
        { search: `%${searchDto.search}%` },
      );
    }

    if (searchDto.status) {
      queryBuilder.andWhere('bugReport.status = :status', { status: searchDto.status });
    }

    if (searchDto.priority) {
      queryBuilder.andWhere('bugReport.priority = :priority', { priority: searchDto.priority });
    }

    if (searchDto.reporterId) {
      queryBuilder.andWhere('bugReport.reporterId = :reporterId', { reporterId: searchDto.reporterId });
    }

    if (searchDto.assignedToId) {
      queryBuilder.andWhere('bugReport.assignedToId = :assignedToId', { assignedToId: searchDto.assignedToId });
    }

    // Non-admin users can only see their own bug reports
    if (currentUser.role !== UserRole.ADMIN) {
      queryBuilder.andWhere('bugReport.reporterId = :currentUserId', { currentUserId: currentUser.id });
    }

    return queryBuilder;
  }

  /**
   * Create paginated response
   */
  private createPaginatedResponse(
    bugReports: BugReport[],
    totalItems: number,
    page: number,
    limit: number,
  ): Pageable<BugReportResponseDto> {
    const data = BugReportResponseDto.fromEntities(bugReports);
    const totalPages = Math.ceil(totalItems / limit);

    return {
      items: data,
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
}
