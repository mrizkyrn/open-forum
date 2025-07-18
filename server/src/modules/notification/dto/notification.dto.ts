import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsArray, IsBoolean, IsInt, IsNumber, IsOptional, IsPositive, Min } from 'class-validator';
import { NotificationEntityType, NotificationType } from '../entities/notification.entity';

export class NotificationResponseDto {
  @ApiProperty({ description: 'Notification ID' })
  id: number;

  @ApiProperty({ description: 'Notification creation date' })
  createdAt: Date;

  @ApiProperty({
    description: 'Type of notification',
    enum: NotificationType,
    example: NotificationType.NEW_COMMENT,
  })
  type: NotificationType;

  @ApiProperty({
    description: 'Type of entity this notification refers to',
    enum: NotificationEntityType,
    example: NotificationEntityType.COMMENT,
  })
  entityType: NotificationEntityType;

  @ApiProperty({ description: 'ID of the entity this notification refers to' })
  entityId: number;

  @ApiProperty({ description: 'Whether the notification has been read' })
  isRead: boolean;

  @ApiProperty({ description: 'Additional data for the notification' })
  data: Record<string, any>;

  @ApiPropertyOptional({ description: 'User who triggered the notification' })
  actor?: {
    id: number;
    username: string;
    fullName: string;
    avatarUrl: string | null;
  };
}

export class NotificationQueryDto {
  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  limit?: number;

  @ApiPropertyOptional({ description: 'Filter by read status' })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  isRead?: boolean;
}

export class MarkNotificationReadDto {
  @ApiProperty({ description: 'Array of notification IDs to mark as read', type: [Number] })
  @IsArray()
  @IsNumber({}, { each: true })
  ids: number[];
}

export class UnreadCountResponseDto {
  @ApiProperty({ description: 'Count of unread notifications' })
  count: number;
}
