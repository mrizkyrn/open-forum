import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Transform, Type } from 'class-transformer';
import { UserResponseDto } from '../../user/dto/user-response.dto';

/**
 * Login response DTO
 *
 * Contains user information and authentication token after successful login.
 */
@Exclude()
export class LoginResponseDto {
  @ApiProperty({
    description: 'Authenticated user information',
    type: UserResponseDto,
  })
  @Expose()
  @Type(() => UserResponseDto)
  user: UserResponseDto;

  @ApiProperty({
    description: 'JWT access token for API authentication',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
    format: 'jwt',
  })
  @Expose()
  accessToken: string;

  @ApiProperty({
    description: 'Token expiration time in seconds',
    example: 3600,
    type: Number,
  })
  @Expose()
  @Transform(({ value }) => Number(value))
  expiresIn: number;

  @ApiProperty({
    description: 'Token type',
    example: 'Bearer',
    default: 'Bearer',
  })
  @Expose()
  tokenType: string = 'Bearer';

  /**
   * Create LoginResponseDto from user and token data
   */
  static create(user: UserResponseDto, accessToken: string, expiresIn: number = 3600): LoginResponseDto {
    const dto = new LoginResponseDto();
    dto.user = user;
    dto.accessToken = accessToken;
    dto.expiresIn = expiresIn;
    dto.tokenType = 'Bearer';

    return dto;
  }
}

/**
 * Token response DTO
 *
 * Contains only authentication token information.
 * Used for token refresh or validation endpoints.
 */
@Exclude()
export class TokenResponseDto {
  @ApiProperty({
    description: 'JWT access token for API authentication',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
    format: 'jwt',
  })
  @Expose()
  accessToken: string;

  @ApiProperty({
    description: 'Token expiration time in seconds',
    example: 3600,
    type: Number,
  })
  @Expose()
  @Transform(({ value }) => Number(value))
  expiresIn: number;

  @ApiProperty({
    description: 'Token type',
    example: 'Bearer',
    default: 'Bearer',
  })
  @Expose()
  tokenType: string = 'Bearer';

  @ApiProperty({
    description: 'Token issue timestamp',
    example: '2025-07-11T10:30:00.000Z',
    type: Date,
  })
  @Expose()
  @Transform(({ value }) => new Date(value))
  issuedAt: Date;

  /**
   * Create TokenResponseDto from token data
   */
  static create(accessToken: string, expiresIn: number = 3600): TokenResponseDto {
    const dto = new TokenResponseDto();
    dto.accessToken = accessToken;
    dto.expiresIn = expiresIn;
    dto.tokenType = 'Bearer';
    dto.issuedAt = new Date();

    return dto;
  }
}

/**
 * Logout response DTO
 *
 * Contains confirmation message after successful logout.
 */
@Exclude()
export class LogoutResponseDto {
  @ApiProperty({
    description: 'Logout confirmation message',
    example: 'Successfully logged out',
  })
  @Expose()
  message: string;

  @ApiProperty({
    description: 'Logout timestamp',
    example: '2025-07-11T10:30:00.000Z',
    type: Date,
  })
  @Expose()
  @Transform(({ value }) => new Date(value))
  loggedOutAt: Date;

  /**
   * Create LogoutResponseDto
   */
  static create(message: string = 'Successfully logged out'): LogoutResponseDto {
    const dto = new LogoutResponseDto();
    dto.message = message;
    dto.loggedOutAt = new Date();

    return dto;
  }
}
