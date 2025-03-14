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
  Put,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ReqUser } from 'src/common/decorators/user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DiscussionSpaceService } from '../discussion/discusison-space.service';
import { CreateDiscussionSpaceDto } from '../discussion/dto/create-discussion-space.dto';
import { DiscussionSpaceResponseDto } from '../discussion/dto/discussion-space-response.dto';
import { UpdateDiscussionSpaceDto } from '../discussion/dto/update-discussion-space.dto';
import { ReportResponseDto } from '../report/dto/report-response.dto';
import { UpdateReportStatusDto } from '../report/dto/update-report-status.dto';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { UpdateUserDto } from '../user/dto/update-user.dto';
import { UserResponseDto } from '../user/dto/user-response.dto';
import { User } from '../user/entities/user.entity';
import { AdminService } from './admin.service';
import { ActivityDataParamsDto } from './dto/activity-data-params.dto';
import { ActivityDataResponseDto } from './dto/activity-data-response.dto';
import { StatsParamsDto } from './dto/stats-params.dto';
import { StatsResponseDto } from './dto/stats-response.dto';

@ApiTags('Admin')
@Controller('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly spaceService: DiscussionSpaceService,
  ) {}

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

  // Discussion space management endpoints
  @Post()
  @UseGuards(RolesGuard)
  @Roles([UserRole.ADMIN])
  @ApiOperation({ summary: 'Create a new discussion space' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: 201,
    description: 'Space created successfully',
    type: DiscussionSpaceResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 409, description: 'Space with this slug already exists' })
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'icon', maxCount: 1 },
      { name: 'banner', maxCount: 1 },
    ]),
  )
  async create(
    @Body() createDto: CreateDiscussionSpaceDto,
    @ReqUser() currentUser: User,
    @UploadedFiles() files?: { icon?: Express.Multer.File[]; banner?: Express.Multer.File[] },
  ): Promise<DiscussionSpaceResponseDto> {
    return this.spaceService.create(createDto, currentUser, files);
  }

  @Patch('spaces/:id')
  @UseGuards(RolesGuard)
  @Roles([UserRole.ADMIN])
  @ApiOperation({ summary: 'Update a discussion space' })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'id', description: 'Space ID', example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Space updated successfully',
    type: DiscussionSpaceResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not the creator of the space' })
  @ApiResponse({ status: 404, description: 'Space not found' })
  @ApiResponse({ status: 409, description: 'Space with this slug already exists' })
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'icon', maxCount: 1 },
      { name: 'banner', maxCount: 1 },
    ]),
  )
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateDiscussionSpaceDto,
    @ReqUser() currentUser: User,
    @UploadedFiles() files?: { icon?: Express.Multer.File[]; banner?: Express.Multer.File[] },
  ): Promise<DiscussionSpaceResponseDto> {
    return this.spaceService.update(id, updateDto, currentUser, files);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles([UserRole.ADMIN])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a discussion space' })
  @ApiParam({ name: 'id', description: 'Space ID', example: 1 })
  @ApiResponse({ status: 200, description: 'Space deleted successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Space has discussions' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not the creator of the space' })
  @ApiResponse({ status: 404, description: 'Space not found' })
  async delete(@Param('id', ParseIntPipe) id: number, @ReqUser() currentUser: User): Promise<void> {
    await this.spaceService.delete(id, currentUser);
  }

  // Report management endpoints

  @Put('reports/:id/status')
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
    return this.adminService.updateReportStatus(id, updateStatusDto, currentUser);
  }
}
