import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WebsocketModule } from '../../core/websocket/websocket.module';
import { CommentModule } from '../comment/comment.module';
import { DiscussionModule } from '../discussion/discussion.module';
import { Notification } from './entities/notification.entity';
import { PushSubscription } from './entities/push-subscription.entity';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { PushNotificationController } from './push-notification.controller';
import { PushNotificationService } from './push-notification.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, PushSubscription]),
    WebsocketModule,
    forwardRef(() => DiscussionModule),
    forwardRef(() => CommentModule),
  ],
  providers: [NotificationService, PushNotificationService],
  controllers: [NotificationController, PushNotificationController],
  exports: [NotificationService, PushNotificationService],
})
export class NotificationModule {}
