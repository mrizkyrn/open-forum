import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

/**
 * User login DTO
 *
 * Contains credentials required for user authentication.
 * Validates username and password format and length.
 */
export class LoginDto {
  @ApiProperty({
    description: 'Username or email for account login',
    example: 'john_doe123',
    minLength: 3,
    maxLength: 100,
  })
  @IsString({
    message: 'Username must be a valid string',
  })
  @IsNotEmpty({
    message: 'Username is required',
  })
  @MinLength(3, {
    message: 'Username must be at least 3 characters long',
  })
  @MaxLength(100, {
    message: 'Username must not exceed 100 characters',
  })
  @Transform(({ value }) => value?.toLowerCase().trim())
  username: string;

  @ApiProperty({
    description: 'User account password',
    example: 'StrongP@ssw0rd123',
    minLength: 8,
    maxLength: 128,
    format: 'password',
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
  password: string;
}
