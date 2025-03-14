import { Controller, Get, Patch, Body, UseGuards, Query, HttpCode, HttpStatus, Delete, Param, ParseIntPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReqUser } from '../../common/decorators/user.decorator';
import { User } from '../user/entities/user.entity';
import { Pageable } from '../../common/interfaces/pageable.interface';
import {
  NotificationResponseDto,
  NotificationQueryDto,
  MarkNotificationReadDto,
  UnreadCountResponseDto,
} from './dto/notification.dto';

@ApiBearerAuth()
@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @ApiOperation({ summary: 'Get current user notifications' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated list of user notifications',
    type: NotificationResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUserNotifications(
    @ReqUser() currentUser: User,
    @Query() queryDto: NotificationQueryDto,
  ): Promise<Pageable<NotificationResponseDto>> {
    console.log("From controller: ", queryDto);
    return this.notificationService.findUserNotifications(currentUser.id, queryDto);
  }

  @Patch('read')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Mark specific notifications as read' })
  @ApiResponse({ status: 204, description: 'Notifications marked as read successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async markNotificationsAsRead(
    @ReqUser() currentUser: User,
    @Body() markReadDto: MarkNotificationReadDto,
  ): Promise<void> {
    await this.notificationService.markAsRead(currentUser.id, markReadDto.ids);
  }

  @Patch('read-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({ status: 204, description: 'All notifications marked as read successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async markAllNotificationsAsRead(@ReqUser() currentUser: User): Promise<void> {
    await this.notificationService.markAllAsRead(currentUser.id);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get count of unread notifications' })
  @ApiResponse({
    status: 200,
    description: 'Returns count of unread notifications',
    type: UnreadCountResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUnreadNotificationsCount(@ReqUser() currentUser: User): Promise<UnreadCountResponseDto> {
    const count = await this.notificationService.getUnreadCount(currentUser.id);
    return { count };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete notification' })
  @ApiResponse({ status: 204, description: 'Notification deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deleteNotification(
    @ReqUser() currentUser: User,
    @Param('id', ParseIntPipe) notificationId: number,
  ): Promise<void> {
    await this.notificationService.deleteNotification(currentUser.id, notificationId);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete all notifications' })
  @ApiResponse({ status: 204, description: 'All notifications deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deleteAllNotifications(@ReqUser() currentUser: User): Promise<void> {
    await this.notificationService.deleteAllNotifications(currentUser.id);
  }
}
