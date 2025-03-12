import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { StatsResponseDto } from './dto/stats-response.dto';
import { StatsParamsDto } from './dto/stats-params.dto';
import { ActivityDataParamsDto } from './dto/activity-data-params.dto';
import { ActivityDataResponseDto } from './dto/activity-data-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';

@ApiTags('Admin')
@Controller('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  @Roles([UserRole.ADMIN])
  @ApiOperation({ summary: 'Get dashboard statistics' })
  @ApiResponse({
    status: 200,
    description: 'Returns overview statistics for the admin dashboard',
    type: StatsParamsDto,
  })
  async getDashboardStats(@Query() statsParamsDto: StatsParamsDto): Promise<StatsResponseDto> {
    return this.adminService.getDashboardStats(statsParamsDto.period, statsParamsDto.comparison);
  }

  @Get('activity')
  @Roles([UserRole.ADMIN])
  @ApiOperation({ summary: 'Get activity data for charts' })
  @ApiResponse({
    status: 200,
    description: 'Returns activity data for dashboard charts',
    type: ActivityDataResponseDto,
  })
  async getActivityData(@Query() activityDataParamsDto: ActivityDataParamsDto): Promise<ActivityDataResponseDto> {
    return this.adminService.getActivityData(activityDataParamsDto.timeRange);
  }
}
