import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as webPush from 'web-push';
import { PushConfig } from '../../config';
import { Notification, NotificationType } from './entities/notification.entity';
import { PushSubscription } from './entities/push-subscription.entity';

@Injectable()
export class PushNotificationService implements OnModuleInit {
  private readonly logger = new Logger(PushNotificationService.name);

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(PushSubscription)
    private readonly pushSubscriptionRepository: Repository<PushSubscription>,
  ) {}

  onModuleInit() {
    const pushConfig = this.configService.get<PushConfig>('push');

    if (!pushConfig?.publicKey || !pushConfig?.privateKey) {
      this.logger.warn('VAPID keys not configured. Push notifications will not work.');
      return;
    }

    webPush.setVapidDetails(pushConfig.subject, pushConfig.publicKey, pushConfig.privateKey);
  }

  async getVapidPublicKey(): Promise<string> {
    return this.configService.get<PushConfig>('push')?.publicKey || '';
  }

  async saveSubscription(userId: number, subscription: any, userAgent?: string): Promise<PushSubscription> {
    try {
      // Extract required fields from subscription
      const { endpoint, keys } = subscription;

      if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
        throw new Error('Invalid push subscription format');
      }

      // Check if this subscription already exists by endpoint
      const existingSubscription = await this.pushSubscriptionRepository.findOne({
        where: { endpoint },
      });

      if (existingSubscription) {
        existingSubscription.userId = userId;
        existingSubscription.p256dh = keys.p256dh;
        existingSubscription.auth = keys.auth;
        existingSubscription.userAgent = userAgent || existingSubscription.userAgent;
        existingSubscription.active = true;
        return this.pushSubscriptionRepository.save(existingSubscription);
      }

      // Create new subscription
      const newSubscription = this.pushSubscriptionRepository.create({
        userId,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        userAgent,
        active: true,
      });

      return this.pushSubscriptionRepository.save(newSubscription);
    } catch (error) {
      this.logger.error(`Failed to save push subscription: ${error.message}`, error.stack);
      throw error;
    }
  }

  async removeSubscription(userId: number, endpoint: string): Promise<void> {
    try {
      const subscription = await this.pushSubscriptionRepository.findOne({
        where: { userId, endpoint },
      });

      if (!subscription) {
        this.logger.warn(`No push subscription found for user ${userId} with endpoint ${endpoint}`);
        return;
      }

      // Mark as inactive instead of deleting
      subscription.active = false;
      await this.pushSubscriptionRepository.save(subscription);
      this.logger.debug(`Push subscription for user ${userId} removed successfully`);
    } catch (error) {
      this.logger.error(`Failed to remove push subscription: ${error.message}`, error.stack);
      throw error;
    }
  }

  async deactivateSubscription(userId: number, endpoint: string): Promise<void> {
    try {
      const result = await this.pushSubscriptionRepository.update(
        { userId, endpoint, active: true },
        { active: false },
      );

      if (result.affected === 0) {
        this.logger.debug(`No active subscription found to deactivate for user ${userId} with endpoint ${endpoint}`);
        return;
      }

      this.logger.debug(`Push subscription deactivated for user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to deactivate push subscription: ${error.message}`, error.stack);
      throw error;
    }
  }

  async reactivateSubscription(userId: number, endpoint: string): Promise<boolean> {
    try {
      // First check if the subscription exists
      const subscription = await this.pushSubscriptionRepository.findOne({
        where: { userId, endpoint, active: false },
      });

      if (subscription) {
        subscription.userId = userId;
        subscription.active = true;
        await this.pushSubscriptionRepository.save(subscription);
        this.logger.debug(`Push subscription reactivated for user ${userId}`);
        return true;
      } else {
        this.logger.warn(`No subscription found to reactivate for endpoint ${endpoint}`);
        return false;
      }
    } catch (error) {
      this.logger.error(`Failed to reactivate push subscription: ${error.message}`, error.stack);
      return false;
    }
  }

  async sendPushNotification(notification: Notification): Promise<void> {
    if (!notification.recipientId) {
      return;
    }

    try {
      const subscriptions = await this.pushSubscriptionRepository.find({
        where: {
          userId: notification.recipientId,
          active: true,
        },
      });

      if (!subscriptions.length) {
        return;
      }

      const payload = JSON.stringify({
        title: this.getNotificationTitle(notification),
        body: this.getNotificationBody(notification),
        data: {
          notificationId: notification.id,
          type: notification.type,
          entityType: notification.entityType,
          entityId: notification.entityId,
          url: notification.data?.url || this.getNotificationUrl(notification),
        },
      });

      // Send to all subscriptions
      const sendPromises = subscriptions.map(async (sub) => {
        try {
          const pushSubscription = {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          };

          await webPush.sendNotification(pushSubscription, payload);
          this.logger.debug(`Push notification sent to user ${sub.userId}`);
        } catch (error) {
          if (error.statusCode === 410) {
            // Subscription has expired or is no longer valid
            await this.pushSubscriptionRepository.update({ id: sub.id }, { active: false });
          } else {
            this.logger.warn(`Failed to send push notification: ${error.message}`);
          }
        }
      });

      await Promise.all(sendPromises);
    } catch (error) {
      this.logger.error(`Push notification error: ${error.message}`, error.stack);
    }
  }

  // Helper methods to format notification content
  private getNotificationTitle(notification: Notification): string {
    switch (notification.type) {
      case NotificationType.NEW_COMMENT:
        return `${notification.actor?.fullName || 'Someone'} commented on your discussion`;
      case NotificationType.NEW_REPLY:
        return `${notification.actor?.fullName || 'Someone'} replied to your comment`;
      case NotificationType.DISCUSSION_UPVOTE:
        return `${notification.actor?.fullName || 'Someone'} upvoted your discussion`;
      case NotificationType.COMMENT_UPVOTE:
        return `${notification.actor?.fullName || 'Someone'} upvoted your comment`;
      case NotificationType.USER_MENTIONED:
        return `${notification.actor?.fullName || 'Someone'} mentioned you in a discussion`;
      default:
        return 'New notification';
    }
  }

  private getNotificationBody(notification: Notification): string {
    // Extract preview from notification data
    if (notification.data?.content) {
      const content = notification.data.content;
      return content.length > 100 ? `${content.substring(0, 100)}...` : content;
    }

    if (notification.data?.contentPreview) {
      return notification.data.contentPreview;
    }

    return 'You have a new notification';
  }

  private getNotificationUrl(notification: Notification): string {
    const baseUrl = this.configService.get('app.clientUrl') || 'http://localhost:3000';
    const discussionId = notification.data?.discussionId;
    const commentId = notification.data?.commentId;

    if (discussionId && commentId) {
      return `${baseUrl}/discussion/${discussionId}?comment=${commentId}`;
    }

    if (discussionId) {
      return `${baseUrl}/discussion/${discussionId}`;
    }

    return `${baseUrl}/notifications`;
  }
}
