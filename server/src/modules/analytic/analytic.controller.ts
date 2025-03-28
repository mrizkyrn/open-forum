import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { Roles } from '../../common/decorators/roles.decorator';
import { ReqUser } from '../../common/decorators/user.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../user/entities/user.entity';
import { AnalyticService } from './analytic.service';
import { PageableUserActivityResponseDto } from './dto/activity-response.dto';
import { SearchActivityDto } from './dto/search-activity.dto';
import { ActivityEntityType, ActivityType, UserActivity } from './entities/user-activity.entity';

@ApiBearerAuth()
@ApiTags('Analytics')
@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnalyticController {
  constructor(private readonly analyticService: AnalyticService) {}

  @Get('activities')
  @Roles([UserRole.ADMIN])
  @ApiOperation({ summary: 'Search user activities with filters' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated list of user activities',
    type: PageableUserActivityResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  async searchActivities(@Query() searchDto: SearchActivityDto): Promise<PageableUserActivityResponseDto> {
    const activities = await this.analyticService.searchActivities(searchDto);
    return PageableUserActivityResponseDto.fromPageable(activities, true);
  }

  @Get('users/most-active')
  @Roles([UserRole.ADMIN])
  @ApiOperation({ summary: 'Get most active users' })
  @ApiQuery({ name: 'days', description: 'Number of days to look back', type: Number, required: false })
  @ApiQuery({ name: 'limit', description: 'Number of users to return', type: Number, required: false })
  @ApiResponse({ status: 200, description: 'Returns list of most active users' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  async getMostActiveUsers(
    @Query('days', ParseIntPipe) days: number = 30,
    @Query('limit', ParseIntPipe) limit: number = 10,
  ): Promise<{ userId: number; activityCount: number }[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    return this.analyticService.getMostActiveUsers(startDate, limit);
  }

  @Get('activities/counts-by-type')
  @Roles([UserRole.ADMIN])
  @ApiOperation({ summary: 'Get activity counts by type' })
  @ApiQuery({ name: 'days', description: 'Number of days to look back', type: Number, required: false })
  @ApiResponse({ status: 200, description: 'Returns activity counts by type' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  async getActivityCountsByType(@Query('days', ParseIntPipe) days: number = 30): Promise<Record<ActivityType, number>> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    return this.analyticService.getActivityCountsByType(startDate);
  }

  @Get('users/:userId/engagement')
  @ApiOperation({ summary: 'Get user engagement score' })
  @ApiParam({ name: 'userId', description: 'User ID', type: Number })
  @ApiQuery({ name: 'days', description: 'Number of days to calculate score for', type: Number, required: false })
  @ApiResponse({ status: 200, description: 'Returns user engagement score' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: "Forbidden - Not authorized to view this user's data" })
  async getUserEngagementScore(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('days', ParseIntPipe) days: number = 30,
    @ReqUser() currentUser: User,
  ): Promise<{ userId: number; score: number }> {
    // Allow users to view their own engagement score or admins/moderators to view any user's
    if (currentUser.id !== userId && ![UserRole.ADMIN].includes(currentUser.role)) {
      throw new Error("Forbidden - Not authorized to view this user's engagement score");
    }

    const score = await this.analyticService.getUserEngagementScore(userId, days);
    return { userId, score };
  }

  @Post('record')
  @Roles([UserRole.ADMIN])
  @ApiOperation({ summary: 'Manually record an activity (admin only)' })
  @ApiResponse({ status: 201, description: 'Activity recorded successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  async recordActivity(
    @Body()
    activity: {
      userId: number;
      type: ActivityType;
      entityType: ActivityEntityType;
      entityId: number;
      metadata?: Record<string, any>;
    },
    @Req() request: Request,
  ): Promise<UserActivity> {
    const recordedActivity = await this.analyticService.recordActivity(
      activity.userId,
      activity.type,
      activity.entityType,
      activity.entityId,
      activity.metadata || {},
      request,
    );

    if (!recordedActivity) {
      throw new Error('Failed to record activity');
    }

    return recordedActivity;
  }
}
