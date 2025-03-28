import { ApiProperty } from '@nestjs/swagger';
import { PaginationMetaDto } from '../../../common/dto/pagination-meta.dto';
import { Pageable } from '../../../common/interfaces/pageable.interface';
import { UserResponseDto } from '../../user/dto/user-response.dto';
import { ActivityEntityType, ActivityType, UserActivity } from '../entities/user-activity.entity';

export class UserActivityResponseDto {
  @ApiProperty({ description: 'Activity ID', example: 1 })
  id: number;

  @ApiProperty({ description: 'User ID', example: 1 })
  userId: number;

  @ApiProperty({
    description: 'User information',
    type: () => UserResponseDto,
    nullable: true,
  })
  user?: UserResponseDto;

  @ApiProperty({
    description: 'Type of activity',
    enum: ActivityType,
    example: ActivityType.CREATE_DISCUSSION,
  })
  type: ActivityType;

  @ApiProperty({
    description: 'Entity type',
    enum: ActivityEntityType,
    example: ActivityEntityType.DISCUSSION,
  })
  entityType: ActivityEntityType;

  @ApiProperty({
    description: 'Related entity ID',
    example: 42,
  })
  entityId: number;

  @ApiProperty({
    description: 'IP address',
    example: '192.168.1.1',
    nullable: true,
  })
  ipAddress?: string;

  @ApiProperty({
    description: 'User agent',
    example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    nullable: true,
  })
  userAgent?: string;

  @ApiProperty({
    description: 'Additional metadata',
    example: { spaceId: 5, isAnonymous: true },
    nullable: true,
  })
  metadata: Record<string, any>;

  @ApiProperty({
    description: 'Activity timestamp',
    example: '2025-03-28T14:30:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2025-03-28T14:30:00.000Z',
  })
  updatedAt: Date;

  static fromEntity(activity: UserActivity, includeUserDetails: boolean = false): UserActivityResponseDto {
    const dto = new UserActivityResponseDto();

    // Map basic properties
    dto.id = activity.id;
    dto.userId = activity.userId;
    dto.type = activity.type;
    dto.entityType = activity.entityType;
    dto.entityId = activity.entityId;
    dto.ipAddress = activity.ipAddress ?? undefined;
    dto.userAgent = activity.userAgent ?? undefined;
    dto.metadata = activity.metadata || {};
    dto.createdAt = activity.createdAt;
    dto.updatedAt = activity.updatedAt;

    // Include user details if available and requested
    if (includeUserDetails && activity.user) {
      dto.user = UserResponseDto.fromEntity(activity.user);
    }

    return dto;
  }

  static fromEntities(activities: UserActivity[], includeUserDetails: boolean = false): UserActivityResponseDto[] {
    return activities.map((activity) => this.fromEntity(activity, includeUserDetails));
  }
}

export class PageableUserActivityResponseDto {
  @ApiProperty({
    type: UserActivityResponseDto,
    description: 'List of user activities',
    isArray: true,
  })
  items: UserActivityResponseDto[];

  @ApiProperty({
    type: PaginationMetaDto,
    description: 'Pagination metadata',
  })
  meta: PaginationMetaDto;

  static fromPageable(
    pageable: Pageable<UserActivity>,
    includeUserDetails: boolean = false,
  ): PageableUserActivityResponseDto {
    const response = new PageableUserActivityResponseDto();
    response.items = UserActivityResponseDto.fromEntities(pageable.items, includeUserDetails);
    response.meta = pageable.meta;
    return response;
  }
}

export class ActivityStatisticsDto {
  @ApiProperty({
    description: 'Total number of activities',
    example: 157,
  })
  total: number;

  @ApiProperty({
    description: 'Activities by type',
    example: {
      login: 20,
      create_discussion: 15,
      create_comment: 45,
      vote: 67,
      bookmark: 10,
    },
  })
  byType: Record<string, number>;

  @ApiProperty({
    description: 'Daily activity count for the last 30 days',
    example: [
      { date: '2025-03-28', count: 12 },
      { date: '2025-03-27', count: 8 },
    ],
  })
  dailyActivity: { date: string; count: number }[];
}
