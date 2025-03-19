import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, In, MoreThan, Repository } from 'typeorm';
import { Pageable } from '../../common/interfaces/pageable.interface';
import { WebsocketGateway } from '../../core/websocket/websocket.gateway';
import { BatchCreateNotificationDto, CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationQueryDto, NotificationResponseDto } from './dto/notification.dto';
import { Notification, NotificationEntityType, NotificationType } from './entities/notification.entity';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly websocketGateway: WebsocketGateway,
  ) {}

  // ----- Create Operations -----

  async createNotification(createDto: CreateNotificationDto): Promise<Notification> {
    try {
      const notification = this.notificationRepository.create({
        recipientId: createDto.recipientId,
        actorId: createDto.actorId,
        type: createDto.type,
        entityType: createDto.entityType,
        entityId: createDto.entityId,
        data: createDto.data || {},
        isRead: false,
      });

      const savedNotification = await this.notificationRepository.save(notification);

      // Notify the user through websocket
      this.notifyRecipient(savedNotification);

      return savedNotification;
    } catch (error) {
      this.logger.error(`Failed to create notification: ${error.message}`, error.stack);
      throw error;
    }
  }

  async createBatchNotifications(
    batchDto: BatchCreateNotificationDto,
    transaction?: EntityManager,
  ): Promise<Notification[]> {
    // Skip if no recipients
    if (!batchDto.recipientIds.length) {
      return [];
    }

    try {
      const notifications = batchDto.recipientIds.map((recipientId) =>
        this.notificationRepository.create({
          recipientId,
          actorId: batchDto.actorId,
          type: batchDto.type,
          entityType: batchDto.entityType,
          entityId: batchDto.entityId,
          data: batchDto.data || {},
          isRead: false,
        }),
      );

      // Use transaction if provided
      const repo = transaction ? transaction.getRepository(Notification) : this.notificationRepository;
      const savedNotifications = await repo.save(notifications);

      // Notify each recipient through websocket
      savedNotifications.forEach((notification) => {
        this.notifyRecipient(notification);
      });

      return savedNotifications;
    } catch (error) {
      this.logger.error(`Failed to create batch notifications: ${error.message}`, error.stack);
      throw error;
    }
  }

  async createNotificationIfNotExists(
    createDto: CreateNotificationDto,
    timeWindowMinutes: number = 5,
  ): Promise<Notification | null> {
    try {
      // Check for similar notification in recent time window
      const exists = await this.checkForExistingNotification(
        createDto.recipientId,
        createDto.actorId ?? null,
        createDto.type,
        createDto.entityType,
        createDto.entityId,
        timeWindowMinutes,
      );

      if (exists) {
        return null; // Skip creation
      }

      return this.createNotification(createDto);
    } catch (error) {
      this.logger.error(`Failed to check and create notification: ${error.message}`, error.stack);
      throw error;
    }
  }

  // ----- Read Operations -----

  async findUserNotifications(
    userId: number,
    queryDto: NotificationQueryDto,
  ): Promise<Pageable<NotificationResponseDto>> {
    try {
      const { page = 1, limit = 20, isRead } = queryDto;
      const offset = (page - 1) * limit;

      const queryBuilder = this.notificationRepository
        .createQueryBuilder('notification')
        .leftJoinAndSelect('notification.actor', 'actor')
        .where('notification.recipientId = :userId', { userId })
        .orderBy('notification.createdAt', 'DESC')
        .skip(offset)
        .take(limit);

      if (isRead !== undefined) {
        queryBuilder.andWhere('notification.isRead = :isRead', { isRead });
      }

      const [notifications, totalItems] = await queryBuilder.getManyAndCount();

      // Format response
      const items = notifications.map((notification) => ({
        id: notification.id,
        createdAt: notification.createdAt,
        type: notification.type,
        entityType: notification.entityType,
        entityId: notification.entityId,
        isRead: notification.isRead,
        data: notification.data,
        actor: notification.actor
          ? {
              id: notification.actor.id,
              username: notification.actor.username,
              fullName: notification.actor.fullName,
              avatarUrl: notification.actor.avatarUrl || null,
            }
          : undefined,
      }));

      // Calculate pagination metadata
      const totalPages = Math.ceil(totalItems / limit);

      return {
        items,
        meta: {
          totalItems,
          itemsPerPage: limit,
          currentPage: page,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to find user notifications: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getUnreadCount(userId: number): Promise<number> {
    try {
      return this.notificationRepository.count({
        where: { recipientId: userId, isRead: false },
      });
    } catch (error) {
      this.logger.error(`Failed to get unread count: ${error.message}`, error.stack);
      throw error;
    }
  }

  async checkForExistingNotification(
    recipientId: number,
    actorId: number | null,
    type: NotificationType,
    entityType: NotificationEntityType,
    entityId: number,
    timeWindowMinutes: number = 5,
  ): Promise<boolean> {
    try {
      // Calculate time threshold (e.g., last 5 minutes)
      const timeThreshold = new Date();
      timeThreshold.setMinutes(timeThreshold.getMinutes() - timeWindowMinutes);

      const notification = await this.notificationRepository.findOne({
        where: {
          recipientId,
          actorId: actorId !== null ? actorId : undefined,
          type,
          entityType,
          entityId,
          createdAt: timeThreshold ? MoreThan(timeThreshold) : undefined,
        },
        order: { createdAt: 'DESC' },
      });

      return !!notification;
    } catch (error) {
      this.logger.error(`Failed to check existing notification: ${error.message}`, error.stack);
      throw error;
    }
  }

  // ----- Update Operations -----

  async markAsRead(userId: number, notificationIds: number[]): Promise<void> {
    try {
      const result = await this.notificationRepository.update(
        { id: In(notificationIds), recipientId: userId },
        { isRead: true },
      );

      if (result.affected === 0) {
        this.logger.warn(`No notifications marked as read for user ${userId}`);
      }
    } catch (error) {
      this.logger.error(`Failed to mark notifications as read: ${error.message}`, error.stack);
      throw error;
    }
  }

  async markAllAsRead(userId: number): Promise<void> {
    try {
      const result = await this.notificationRepository.update({ recipientId: userId, isRead: false }, { isRead: true });

      if (result.affected === 0) {
        this.logger.debug(`No unread notifications found for user ${userId}`);
      } else {
        this.logger.debug(`Marked ${result.affected} notifications as read for user ${userId}`);
      }
    } catch (error) {
      this.logger.error(`Failed to mark all notifications as read: ${error.message}`, error.stack);
      throw error;
    }
  }

  // ----- Delete Operations -----

  async deleteNotification(userId: number, notificationId: number): Promise<void> {
    try {
      const result = await this.notificationRepository.delete({
        id: notificationId,
        recipientId: userId,
      });

      if (result.affected === 0) {
        throw new NotFoundException(
          `Notification with ID ${notificationId} not found or doesn't belong to user ${userId}`,
        );
      }
    } catch (error) {
      this.logger.error(`Failed to delete notification: ${error.message}`, error.stack);
      throw error;
    }
  }

  async deleteAllNotifications(userId: number): Promise<void> {
    try {
      const result = await this.notificationRepository.delete({ recipientId: userId });

      this.logger.debug(`Deleted ${result.affected} notifications for user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to delete all notifications: ${error.message}`, error.stack);
      throw error;
    }
  }

  async deleteNotificationsByEntity(entityType: NotificationEntityType, entityId: number): Promise<void> {
    try {
      const result = await this.notificationRepository.delete({
        entityType,
        entityId,
      });

      this.logger.debug(`Deleted ${result.affected} notifications for ${entityType} with ID ${entityId}`);
    } catch (error) {
      this.logger.error(`Failed to delete notifications by entity: ${error.message}`, error.stack);
      throw error;
    }
  }

  // ----- Helper Methods -----

  private notifyRecipient(notification: Notification): void {
    try {
      // Skip notification if it's a system notification
      if (!notification.recipientId) return;

      // Emit the notification event to the specific user
      this.websocketGateway.sendNotification(notification.recipientId, {
        id: notification.id,
        type: notification.type,
        entityType: notification.entityType,
        entityId: notification.entityId,
        data: notification.data,
        createdAt: notification.createdAt,
        isRead: notification.isRead,
        actorId: notification.actorId,
      });
    } catch (error) {
      // Log but don't throw - notification delivery should be best-effort
      this.logger.warn(`Failed to notify recipient ${notification.recipientId}: ${error.message}`);
    }
  }
}
