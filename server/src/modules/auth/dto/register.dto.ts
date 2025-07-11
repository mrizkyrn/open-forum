import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * User registration DTO
 *
 * Contains all required information for creating a new user account.
 * Includes comprehensive validation and transformation rules.
 */
export class RegisterDto {
  @ApiPropertyOptional({
    description: 'User email address (optional but recommended)',
    example: 'john.doe@example.com',
    format: 'email',
    maxLength: 100,
    nullable: true,
  })
  @IsOptional()
  @IsEmail(
    {},
    {
      message: 'Please provide a valid email address',
    },
  )
  @MaxLength(100, {
    message: 'Email must not exceed 100 characters',
  })
  @Transform(({ value }) => value?.toLowerCase().trim() || null)
  email?: string | null;

  @ApiProperty({
    description: 'Unique username for account login',
    example: 'john_doe123',
    minLength: 3,
    maxLength: 25,
    pattern: '^[a-zA-Z0-9_.-]+$',
  })
  @IsString({
    message: 'Username must be a valid string',
  })
  @IsNotEmpty({
    message: 'Username is required',
  })
  @Length(3, 25, {
    message: 'Username must be between 3 and 25 characters',
  })
  @Matches(/^[a-zA-Z0-9_.-]+$/, {
    message: 'Username can only contain letters, numbers, underscores, dots, and hyphens',
  })
  @Transform(({ value }) => value?.toLowerCase().trim())
  username: string;

  @ApiProperty({
    description: 'User password with complexity requirements',
    example: 'StrongP@ssw0rd123',
    minLength: 8,
    maxLength: 128,
    pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$',
  })
  @IsString({
    message: 'Password must be a valid string',
  })
  @IsNotEmpty({
    message: 'Password is required',
  })
  @MinLength(8, {
    message: 'Password must be at least 8 characters long',
  })
  @MaxLength(128, {
    message: 'Password must not exceed 128 characters',
  })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\W]{8,}$/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
  })
  password: string;

  @ApiProperty({
    description: 'Full name of the user',
    example: 'John Doe',
    minLength: 2,
    maxLength: 100,
  })
  @IsString({
    message: 'Full name must be a valid string',
  })
  @IsNotEmpty({
    message: 'Full name is required',
  })
  @MinLength(2, {
    message: 'Full name must be at least 2 characters long',
  })
  @MaxLength(100, {
    message: 'Full name must not exceed 100 characters',
  })
  @Transform(({ value }) => value?.trim())
  fullName: string;

  @ApiPropertyOptional({
    description: 'Profile picture URL (optional)',
    example: 'https://example.com/avatars/john-doe.jpg',
    format: 'uri',
    maxLength: 500,
    nullable: true,
  })
  @IsOptional()
  @IsUrl(
    {
      protocols: ['http', 'https'],
      require_protocol: true,
    },
    {
      message: 'Avatar URL must be a valid HTTP or HTTPS URL',
    },
  )
  @MaxLength(500, {
    message: 'Avatar URL must not exceed 500 characters',
  })
  @Transform(({ value }) => value?.trim() || null)
  avatarUrl?: string | null;
}
