import { Controller, Get, HttpCode, HttpStatus, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminService } from './admin.service';
import { ActivityDataResponseDto } from './dto/activity-data-response.dto';
import { DashboardStatsResponseDto } from './dto/dashboard-stats-response.dto';
import { TimeRangeType } from './types/admin.type';

@ApiTags('Admin')
@Controller('admin/dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminDashboardController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  @Roles([UserRole.ADMIN])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get dashboard statistics' })
  @ApiQuery({ name: 'period', enum: ['day', 'week', 'month'], required: false, description: 'Current period' })
  @ApiQuery({
    name: 'comparisonPeriod',
    enum: ['day', 'week', 'month'],
    required: false,
    description: 'Comparison period',
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard statistics retrieved successfully',
    type: DashboardStatsResponseDto,
  })
  async getDashboardStats(
    @Query('period') period: TimeRangeType = 'day',
    @Query('comparisonPeriod') comparisonPeriod?: TimeRangeType,
  ): Promise<DashboardStatsResponseDto> {
    return this.adminService.getDashboardStats(period, comparisonPeriod);
  }

  @Get('activity')
  @Roles([UserRole.ADMIN])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get activity time series data' })
  @ApiQuery({ name: 'timeRange', enum: ['day', 'week', 'month'], required: false, description: 'Time range' })
  @ApiResponse({
    status: 200,
    description: 'Activity data retrieved successfully',
    type: ActivityDataResponseDto,
  })
  async getActivityData(@Query('timeRange') timeRange: TimeRangeType = 'week'): Promise<ActivityDataResponseDto> {
    return this.adminService.getActivityData(timeRange);
  }
}
