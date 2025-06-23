import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsInt, IsNotEmpty, IsNumber, IsObject, IsOptional } from 'class-validator';
import { NotificationEntityType, NotificationType } from '../entities/notification.entity';

export class CreateNotificationDto {
  @ApiProperty({
    description: 'ID of the user receiving the notification',
    example: 1,
  })
  @IsInt()
  @IsNotEmpty()
  recipientId: number;

  @ApiPropertyOptional({
    description: 'ID of the user who triggered the notification (can be null for system notifications)',
    example: 2,
    nullable: true,
  })
  @IsInt()
  @IsOptional()
  actorId?: number | null;

  @ApiProperty({
    description: 'Type of notification',
    enum: NotificationType,
    example: NotificationType.NEW_COMMENT,
  })
  @IsEnum(NotificationType)
  @IsNotEmpty()
  type: NotificationType;

  @ApiProperty({
    description: 'Type of entity this notification refers to',
    enum: NotificationEntityType,
    example: NotificationEntityType.DISCUSSION,
  })
  @IsEnum(NotificationEntityType)
  @IsNotEmpty()
  entityType: NotificationEntityType;

  @ApiProperty({
    description: 'ID of the entity this notification refers to',
    example: 1,
  })
  @IsInt()
  @IsNotEmpty()
  entityId: number;

  @ApiPropertyOptional({
    description: 'Additional data for the notification',
    example: { commentId: 5, discussionTitle: 'How to implement...' },
  })
  @IsObject()
  @IsOptional()
  data?: Record<string, any>;
}

export class BatchCreateNotificationDto {
  @ApiProperty({
    description: 'List of notification recipients',
    example: [1, 2, 3],
    type: [Number],
  })
  @IsInt({ each: true })
  @IsNotEmpty()
  recipientIds: number[];

  @ApiPropertyOptional({
    description: 'ID of the user who triggered the notification',
    example: 2,
    nullable: true,
  })
  @IsInt()
  @IsOptional()
  actorId?: number | null;

  @ApiProperty({
    description: 'Type of notification',
    enum: NotificationType,
    example: NotificationType.NEW_DISCUSSION,
  })
  @IsEnum(NotificationType)
  @IsNotEmpty()
  type: NotificationType;

  @ApiProperty({
    description: 'Type of entity this notification refers to',
    enum: NotificationEntityType,
    example: NotificationEntityType.DISCUSSION,
  })
  @IsEnum(NotificationEntityType)
  @IsNotEmpty()
  entityType: NotificationEntityType;

  @ApiProperty({
    description: 'ID of the entity this notification refers to',
    example: 1,
  })
  @IsInt()
  @IsNotEmpty()
  entityId: number;

  @ApiPropertyOptional({
    description: 'Additional data for the notification',
    example: { discussionTitle: 'How to implement...' },
  })
  @IsObject()
  @IsOptional()
  data?: Record<string, any>;
}
