import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReqUser } from '../../common/decorators/user.decorator';
import { User } from '../user/entities/user.entity';
import { ReportService } from './report.service';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportStatusDto } from './dto/update-report-status.dto';
import { SearchReportDto } from './dto/search-report.dto';
import { ReportReason } from './entities/report-reason.entity';
import { Pageable } from '../../common/interfaces/pageable.interface';
import { ReportResponseDto, PageableReportResponseDto, ReportReasonResponseDto } from './dto/report-response.dto';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/common/enums/user-role.enum';

@ApiTags('Reports')
@Controller('reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new report' })
  @ApiResponse({
    status: 201,
    description: 'Report created successfully',
    type: ReportResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createReport(
    @Body() createReportDto: CreateReportDto,
    @ReqUser() currentUser: User,
  ): Promise<ReportResponseDto> {
    return this.reportService.createReport(createReportDto, currentUser);
  }

  @Get()
  @ApiOperation({ summary: 'Get reports with pagination and filters' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated list of reports',
    type: PageableReportResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getReports(
    @Query() searchDto: SearchReportDto,
    @ReqUser() currentUser: User,
  ): Promise<Pageable<ReportResponseDto>> {
    return this.reportService.findAll(searchDto, currentUser);
  }

  @Get('reasons')
  @ApiOperation({ summary: 'Get all report reasons' })
  @ApiResponse({
    status: 200,
    description: 'Returns list of report reasons',
    type: [ReportReasonResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getReportReasons(): Promise<ReportReasonResponseDto[]> {
    return this.reportService.getReportReasons();
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get report statistics' })
  @ApiResponse({
    status: 200,
    description: 'Returns report statistics',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number' },
        pending: { type: 'number' },
        resolved: { type: 'number' },
        dismissed: { type: 'number' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getReportStats(
    @ReqUser() currentUser: User,
  ): Promise<{ total: number; pending: number; resolved: number; dismissed: number }> {
    return this.reportService.getReportStats(currentUser);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get report by ID' })
  @ApiParam({ name: 'id', description: 'Report ID', type: Number })
  @ApiResponse({ status: 200, description: 'Returns report details', type: ReportResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not authorized to view this report' })
  @ApiResponse({ status: 404, description: 'Report not found' })
  async getReportById(@Param('id', ParseIntPipe) id: number, @ReqUser() currentUser: User): Promise<ReportResponseDto> {
    return this.reportService.findById(id, currentUser);
  }

  @Put(':id/status')
  @UseGuards(RolesGuard)
  @Roles([UserRole.ADMIN])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update report status' })
  @ApiParam({ name: 'id', description: 'Report ID', type: Number })
  @ApiResponse({ status: 200, description: 'Report status updated successfully', type: ReportResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not authorized to update reports' })
  @ApiResponse({ status: 404, description: 'Report not found' })
  async updateReportStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStatusDto: UpdateReportStatusDto,
    @ReqUser() currentUser: User,
  ): Promise<ReportResponseDto> {
    return this.reportService.updateStatus(id, updateStatusDto, currentUser);
  }
}
