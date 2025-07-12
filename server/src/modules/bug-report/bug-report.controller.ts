import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { ReqUser } from '../../common/decorators/user.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { Pageable } from '../../common/interfaces/pageable.interface';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../user/entities/user.entity';
import { BugReportService } from './bug-report.service';
import {
  BugReportResponseDto,
  CreateBugReportDto,
  SearchBugReportDto,
  UpdateBugReportDto,
  UpdateBugReportStatusDto,
} from './dto';

/**
 * Bug Report Controller
 *
 * Handles all bug report-related HTTP requests including:
 * - Creating bug reports
 * - Viewing bug reports
 * - Updating bug reports
 * - Deleting bug reports
 * - Assigning bug reports (admin only)
 */
@ApiTags('Bug Reports')
@Controller('bug-reports')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BugReportController {
  constructor(private readonly bugReportService: BugReportService) {}

  // ==================== BUG REPORT LISTING & SEARCH ====================

  @Get()
  @ApiOperation({
    summary: 'Get all bug reports with pagination and filtering',
    description: 'Retrieve a paginated list of bug reports with optional search and filtering capabilities',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully retrieved paginated list of bug reports',
    type: 'PageableBugReportResponseDto',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication required',
  })
  async getAllBugReports(
    @Query(new ValidationPipe({ transform: true, whitelist: true }))
    searchDto: SearchBugReportDto,
    @ReqUser() currentUser: User,
  ): Promise<Pageable<BugReportResponseDto>> {
    return this.bugReportService.findAll(searchDto, currentUser);
  }

  // ==================== BUG REPORT CRUD OPERATIONS ====================

  @Get(':id')
  @ApiOperation({
    summary: 'Get bug report by ID',
    description: 'Retrieve detailed information about a specific bug report',
  })
  @ApiParam({
    name: 'id',
    description: 'Bug report ID',
    example: 1,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully retrieved bug report details',
    type: BugReportResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Bug report not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication required',
  })
  async getBugReportById(@Param('id', ParseIntPipe) id: number): Promise<BugReportResponseDto> {
    return this.bugReportService.findById(id);
  }

  @Post()
  @ApiOperation({
    summary: 'Create a new bug report',
    description: 'Submit a new bug report to the system',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Bug report created successfully',
    type: BugReportResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication required',
  })
  async createBugReport(
    @Body(new ValidationPipe({ whitelist: true, transform: true }))
    createBugReportDto: CreateBugReportDto,
    @ReqUser() currentUser: User,
  ): Promise<BugReportResponseDto> {
    return this.bugReportService.create(createBugReportDto, currentUser);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a bug report',
    description: 'Update bug report information. Users can only update their own reports, admins can update any report',
  })
  @ApiParam({
    name: 'id',
    description: 'Bug report ID',
    example: 1,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bug report updated successfully',
    type: BugReportResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Bug report not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'You can only update your own bug reports',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication required',
  })
  async updateBugReport(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ValidationPipe({ whitelist: true, transform: true }))
    updateBugReportDto: UpdateBugReportDto,
    @ReqUser() currentUser: User,
  ): Promise<BugReportResponseDto> {
    return this.bugReportService.update(id, updateBugReportDto, currentUser);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a bug report',
    description: 'Delete a bug report. Users can only delete their own reports, admins can delete any report',
  })
  @ApiParam({
    name: 'id',
    description: 'Bug report ID',
    example: 1,
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Bug report deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Bug report not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'You can only delete your own bug reports',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication required',
  })
  async deleteBugReport(@Param('id', ParseIntPipe) id: number, @ReqUser() currentUser: User): Promise<void> {
    return this.bugReportService.remove(id, currentUser);
  }

  // ==================== ADMIN OPERATIONS ====================

  @Patch(':id/assign/:userId')
  @Roles([UserRole.ADMIN])
  @ApiOperation({
    summary: 'Assign bug report to a user (Admin only)',
    description: 'Assign a bug report to a specific user for resolution. Only administrators can perform this action',
  })
  @ApiParam({
    name: 'id',
    description: 'Bug report ID',
    example: 1,
  })
  @ApiParam({
    name: 'userId',
    description: 'User ID to assign the bug report to (use 0 to unassign)',
    example: 2,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bug report assigned successfully',
    type: BugReportResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Bug report not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Only admins can assign bug reports',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication required',
  })
  async assignBugReport(
    @Param('id', ParseIntPipe) id: number,
    @Param('userId', ParseIntPipe) userId: number,
    @ReqUser() currentUser: User,
  ): Promise<BugReportResponseDto> {
    // Convert 0 to null for unassigning
    const assignedToId = userId === 0 ? null : userId;
    return this.bugReportService.assignBugReport(id, assignedToId, currentUser);
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Update bug report status',
    description:
      'Update the status of a bug report. Admins can update any report, assigned users can update their assigned reports, and reporters can mark their own reports as resolved',
  })
  @ApiParam({
    name: 'id',
    description: 'Bug report ID',
    example: 1,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bug report status updated successfully',
    type: BugReportResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid status or missing resolution',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Bug report not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'You do not have permission to update this bug report status',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication required',
  })
  async updateBugReportStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ValidationPipe({ whitelist: true, transform: true }))
    updateStatusDto: UpdateBugReportStatusDto,
    @ReqUser() currentUser: User,
  ): Promise<BugReportResponseDto> {
    return this.bugReportService.updateStatus(id, updateStatusDto, currentUser);
  }
}
