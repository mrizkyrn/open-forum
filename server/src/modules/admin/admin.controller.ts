import { Controller, Get, UseGuards, Query, Post, Body, Put, Param, ParseIntPipe, Delete } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { StatsResponseDto } from './dto/stats-response.dto';
import { StatsParamsDto } from './dto/stats-params.dto';
import { ActivityDataParamsDto } from './dto/activity-data-params.dto';
import { ActivityDataResponseDto } from './dto/activity-data-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { UserResponseDto } from '../user/dto/user-response.dto';
import { UpdateUserDto } from '../user/dto/update-user.dto';
import { ReqUser } from 'src/common/decorators/user.decorator';
import { User } from '../user/entities/user.entity';

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

  // User management endpoints
  @Post('users')
  @Roles([UserRole.ADMIN])
  @ApiOperation({ summary: 'Create new user' })
  @ApiResponse({ status: 201, description: 'User created successfully', type: UserResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 409, description: 'Username already exists' })
  async createUser(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    return this.adminService.createUser(createUserDto);
  }

  @Put('users/:id')
  @Roles([UserRole.ADMIN])
  @ApiOperation({ summary: 'Update user' })
  @ApiParam({ name: 'id', description: 'User ID', type: Number })
  @ApiResponse({ status: 200, description: 'User updated successfully', type: UserResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return this.adminService.updateUser(id, updateUserDto);
  }

  @Delete('users/:id')
  @Roles([UserRole.ADMIN])
  @ApiOperation({ summary: 'Delete user' })
  @ApiParam({ name: 'id', description: 'User ID', type: Number })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Cannot delete own account' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async deleteUser(@Param('id', ParseIntPipe) id: number, @ReqUser() currentUser: User): Promise<void> {
    return this.adminService.deleteUser(id, currentUser.id);
  }
}
