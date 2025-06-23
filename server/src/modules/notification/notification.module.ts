import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WebsocketModule } from '../../core/websocket/websocket.module';
import { CommentModule } from '../comment/comment.module';
import { DiscussionModule } from '../discussion/discussion.module';
import { Notification } from './entities/notification.entity';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { PushSubscription } from './entities/push-subscription.entity';
import { PushNotificationService } from './push-notification.service';
import { PushNotificationController } from './push-notification.controller';
import { NotificationEventService } from './notification-event.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, PushSubscription]),
    WebsocketModule,
    forwardRef(() => DiscussionModule),
    forwardRef(() => CommentModule),
  ],
  providers: [NotificationService, PushNotificationService, NotificationEventService],
  controllers: [NotificationController, PushNotificationController],
  exports: [NotificationService, PushNotificationService, NotificationEventService],
})
export class NotificationModule {}
