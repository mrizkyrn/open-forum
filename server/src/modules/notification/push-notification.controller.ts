import { Body, Controller, Delete, Get, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ReqUser } from '../../common/decorators/user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../user/entities/user.entity';
import { SubscribeToPushDto, VapidPublicKeyDto } from './dto/push-notification.dto';
import { PushNotificationService } from './push-notification.service';

@ApiTags('Push Notifications')
@Controller('push-notifications')
export class PushNotificationController {
  constructor(private readonly pushNotificationService: PushNotificationService) {}

  @Get('public-key')
  @ApiOperation({ summary: 'Get VAPID public key for push notifications' })
  async getPublicKey(): Promise<VapidPublicKeyDto> {
    const publicKey = await this.pushNotificationService.getVapidPublicKey();
    return { publicKey };
  }

  @Post('subscribe')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Subscribe to push notifications' })
  @HttpCode(200)
  async subscribe(@ReqUser() user: User, @Body() dto: SubscribeToPushDto) {
    await this.pushNotificationService.saveSubscription(user.id, dto.subscription, dto.userAgent);
    return { success: true };
  }

  @Delete('unsubscribe/:endpoint')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unsubscribe from push notifications' })
  @HttpCode(200)
  async unsubscribe(@ReqUser() user: User, @Param('endpoint') endpoint: string) {
    await this.pushNotificationService.removeSubscription(user.id, endpoint);
    return { success: true };
  }

  @Post('deactivate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deactivate push notifications during logout' })
  @HttpCode(200)
  async deactivate(@ReqUser() user: User, @Body() dto: { endpoint: string }) {
    await this.pushNotificationService.deactivateSubscription(user.id, dto.endpoint);
    return { success: true };
  }

  @Post('reactivate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reactivate push notifications during login' })
  @HttpCode(200)
  async reactivate(@ReqUser() user: User, @Body() dto: { endpoint: string }) {
    await this.pushNotificationService.reactivateSubscription(user.id, dto.endpoint);
    return { success: true };
  }
}
