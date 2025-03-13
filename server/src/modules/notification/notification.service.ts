import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Notification, NotificationType, NotificationEntityType } from './entities/notification.entity';
import { User } from '../user/entities/user.entity';
import { Pageable } from '../../common/interfaces/pageable.interface';
import { NotificationResponseDto, NotificationQueryDto } from './dto/notification.dto';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
  ) {}

  async createNotification(
    recipientId: number,
    actorId: number | null,
    type: NotificationType,
    entityType: NotificationEntityType,
    entityId: number,
    data: Record<string, any> = {},
  ): Promise<Notification> {
    const notification = this.notificationRepository.create({
      recipientId,
      actorId,
      type,
      entityType,
      entityId,
      data,
      isRead: false,
    });

    return this.notificationRepository.save(notification);
  }

  async findUserNotifications(
    userId: number,
    queryDto: NotificationQueryDto,
  ): Promise<Pageable<NotificationResponseDto>> {
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
  }

  async markAsRead(userId: number, notificationIds: number[]): Promise<void> {
    await this.notificationRepository.update({ id: In(notificationIds), recipientId: userId }, { isRead: true });
  }

  async markAllAsRead(userId: number): Promise<void> {
    await this.notificationRepository.update({ recipientId: userId, isRead: false }, { isRead: true });
  }

  async getUnreadCount(userId: number): Promise<number> {
    return this.notificationRepository.count({
      where: { recipientId: userId, isRead: false },
    });
  }

  async deleteNotification(userId: number, notificationId: number): Promise<void> {
    await this.notificationRepository.delete({ id: notificationId, recipientId: userId });
  }

  async deleteAllNotifications(userId: number): Promise<void> {
    await this.notificationRepository.delete({ recipientId: userId });
  }

  async findExistingNotification(
    recipientId: number,
    actorId: number,
    type: NotificationType,
    entityType: NotificationEntityType,
    entityId: number,
  ): Promise<boolean> {
    const notification = await this.notificationRepository.findOne({
      where: { recipientId, actorId, type, entityType, entityId },
    });

    return !!notification;
  }
}
