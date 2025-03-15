import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ReqUser } from '../../common/decorators/user.decorator';
import { Pageable } from '../../common/interfaces/pageable.interface';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../user/entities/user.entity';
import { CreateReportDto } from './dto/create-report.dto';
import {
  PageableReportResponseDto,
  ReportReasonResponseDto,
  ReportResponseDto,
  ReportStatsResponseDto,
} from './dto/report-response.dto';
import { SearchReportDto } from './dto/search-report.dto';
import { ReportService } from './report.service';

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
    type: ReportStatsResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getReportStats(@ReqUser() currentUser: User): Promise<ReportStatsResponseDto> {
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
}
