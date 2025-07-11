import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Transform, Type } from 'class-transformer';
import { PaginationMetaDto } from '../../../common/dto/pagination-meta.dto';
import { UserRole } from '../../../common/enums/user-role.enum';
import { User } from '../entities/user.entity';

/**
 * Base user response DTO with common user information
 */
@Exclude()
export class UserResponseDto {
  @ApiProperty({
    description: 'Unique user identifier',
    example: 1,
    type: Number,
  })
  @Expose()
  @Type(() => Number)
  id: number;

  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@example.com',
    nullable: true,
    required: false,
  })
  @Expose()
  email?: string | null;

  @ApiProperty({
    description: 'Unique username',
    example: 'john_doe123',
  })
  @Expose()
  username: string;

  @ApiProperty({
    description: 'User full name',
    example: 'John Doe',
  })
  @Expose()
  fullName: string;

  @ApiProperty({
    description: 'User role in the system',
    enum: UserRole,
    enumName: 'UserRole',
    example: UserRole.USER,
  })
  @Expose()
  role: UserRole;

  @ApiProperty({
    description: 'URL to user avatar image',
    example: 'https://example.com/avatars/user-123.jpg',
    nullable: true,
    required: false,
  })
  @Expose()
  avatarUrl?: string | null;

  @ApiProperty({
    description: 'Last time user was active',
    example: '2025-07-10T12:00:00.000Z',
    type: Date,
    nullable: true,
    required: false,
  })
  @Expose()
  @Transform(({ value }) => (value ? new Date(value) : null))
  lastActiveAt?: Date | null;

  @ApiProperty({
    description: 'Account creation timestamp',
    example: '2025-01-01T00:00:00.000Z',
    type: Date,
  })
  @Expose()
  @Transform(({ value }) => new Date(value))
  createdAt: Date;

  @ApiProperty({
    description: 'Last account update timestamp',
    example: '2025-07-10T12:00:00.000Z',
    type: Date,
  })
  @Expose()
  @Transform(({ value }) => new Date(value))
  updatedAt: Date;

  /**
   * Create UserResponseDto from User entity
   */
  static fromEntity(user: User): UserResponseDto {
    const dto = new UserResponseDto();
    dto.id = user.id;
    dto.email = user.email;
    dto.username = user.username;
    dto.fullName = user.fullName;
    dto.role = user.role;
    dto.avatarUrl = user.avatarUrl;
    dto.lastActiveAt = user.lastActiveAt;
    dto.createdAt = user.createdAt;
    dto.updatedAt = user.updatedAt;

    return dto;
  }

  /**
   * Create anonymous user representation
   */
  static createAnonymous(userId?: number): UserResponseDto {
    const dto = new UserResponseDto();

    if (userId) {
      dto.id = userId;
      dto.username = '(You - Anonymous)';
      dto.fullName = '(You - Anonymous)';
    } else {
      dto.username = 'Anonymous';
      dto.fullName = 'Anonymous';
    }

    dto.avatarUrl = null;
    dto.role = UserRole.USER;
    dto.createdAt = new Date();
    dto.updatedAt = new Date();

    return dto;
  }
}

/**
 * Detailed user response DTO with sensitive information (for authenticated requests)
 */
@Exclude()
export class UserDetailResponseDto {
  @ApiProperty({
    description: 'Unique user identifier',
    example: 1,
    type: Number,
  })
  @Expose()
  @Type(() => Number)
  id: number;

  @ApiProperty({
    description: 'Unique username',
    example: 'john_doe123',
  })
  @Expose()
  username: string;

  @ApiProperty({
    description: 'User full name',
    example: 'John Doe',
  })
  @Expose()
  fullName: string;

  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@example.com',
    nullable: true,
    required: false,
  })
  @Expose()
  email: string | null;

  @ApiProperty({
    description: 'User role in the system',
    enum: UserRole,
    enumName: 'UserRole',
    example: UserRole.USER,
  })
  @Expose()
  role: UserRole;

  @ApiProperty({
    description: 'URL to user avatar image',
    example: 'https://example.com/avatars/user-123.jpg',
    nullable: true,
    required: false,
  })
  @Expose()
  avatarUrl: string | null;

  @ApiProperty({
    description: 'Last time user was active',
    example: '2025-07-10T12:00:00.000Z',
    type: Date,
    nullable: true,
    required: false,
  })
  @Expose()
  @Transform(({ value }) => (value ? new Date(value) : null))
  lastActiveAt: Date | null;

  @ApiProperty({
    description: 'OAuth provider used for authentication',
    example: 'google',
    nullable: true,
    required: false,
  })
  @Expose()
  oauthProvider: string | null;

  @ApiProperty({
    description: 'Account creation timestamp',
    example: '2025-01-01T00:00:00.000Z',
    type: Date,
  })
  @Expose()
  @Transform(({ value }) => new Date(value))
  createdAt: Date;

  @ApiProperty({
    description: 'Last account update timestamp',
    example: '2025-07-10T12:00:00.000Z',
    type: Date,
  })
  @Expose()
  @Transform(({ value }) => new Date(value))
  updatedAt: Date;

  /**
   * Create UserDetailResponseDto from User entity
   */
  static fromEntity(user: User): UserDetailResponseDto {
    const dto = new UserDetailResponseDto();
    dto.id = user.id;
    dto.username = user.username;
    dto.fullName = user.fullName;
    dto.email = user.email;
    dto.role = user.role;
    dto.avatarUrl = user.avatarUrl;
    dto.lastActiveAt = user.lastActiveAt;
    dto.oauthProvider = user.oauthProvider;
    dto.createdAt = user.createdAt;
    dto.updatedAt = user.updatedAt;

    return dto;
  }
}

/**
 * Paginated response DTO for user lists
 */
export class PageableUserResponseDto {
  @ApiProperty({
    description: 'List of users',
    type: [UserResponseDto],
    isArray: true,
  })
  @Type(() => UserResponseDto)
  items: UserResponseDto[];

  @ApiProperty({
    description: 'Pagination metadata',
    type: PaginationMetaDto,
  })
  @Type(() => PaginationMetaDto)
  meta: PaginationMetaDto;
}
