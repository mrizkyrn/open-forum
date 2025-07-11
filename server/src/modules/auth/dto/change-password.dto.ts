import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';

/**
 * Change password DTO
 *
 * Contains current and new password for authenticated users.
 */
export class ChangePasswordDto {
  @ApiProperty({
    description: 'Current password for verification',
    example: 'CurrentP@ssw0rd123',
    format: 'password',
  })
  @IsString({
    message: 'Current password must be a valid string',
  })
  @IsNotEmpty({
    message: 'Current password is required',
  })
  currentPassword: string;

  @ApiProperty({
    description: 'New password with complexity requirements',
    example: 'NewStrongP@ssw0rd123',
    minLength: 8,
    maxLength: 128,
    format: 'password',
  })
  @IsString({
    message: 'New password must be a valid string',
  })
  @IsNotEmpty({
    message: 'New password is required',
  })
  @MinLength(8, {
    message: 'New password must be at least 8 characters long',
  })
  @MaxLength(128, {
    message: 'New password must not exceed 128 characters',
  })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\W]{8,}$/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
  })
  newPassword: string;
}
