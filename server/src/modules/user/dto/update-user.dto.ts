import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsEnum, IsOptional, IsString, Length, Matches } from 'class-validator';
import { UserRole } from '../../../common/enums/user-role.enum';

/**
 * DTO for updating user information
 */
export class UpdateUserDto {
  @ApiPropertyOptional({
    description: 'Unique username for login',
    example: 'john_doe123',
    minLength: 3,
    maxLength: 25,
  })
  @IsOptional()
  @IsString({ message: 'Username must be a string' })
  @Length(3, 25, { message: 'Username must be between 3 and 25 characters' })
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Username can only contain letters, numbers, and underscores',
  })
  @Transform(({ value }) => value?.toLowerCase().trim())
  username?: string;

  @ApiPropertyOptional({
    description: 'Full name of the user',
    example: 'John Doe',
    maxLength: 100,
  })
  @IsOptional()
  @IsString({ message: 'Full name must be a string' })
  @Length(3, 100, { message: 'Full name must be between 3 and 100 characters' })
  @Transform(({ value }) => value?.trim())
  fullName?: string;

  @ApiPropertyOptional({
    description: 'User role in the system',
    enum: UserRole,
    enumName: 'UserRole',
    example: UserRole.USER,
  })
  @IsOptional()
  @IsEnum(UserRole, { message: 'Role must be a valid user role' })
  @Type(() => String)
  role?: UserRole;

  @ApiPropertyOptional({
    description: 'New password (will be hashed)',
    example: 'NewStrongP@ssw0rd123',
    minLength: 8,
    maxLength: 100,
    format: 'password',
  })
  @IsOptional()
  @IsString({ message: 'Password must be a string' })
  @Length(8, 100, { message: 'Password must be between 8 and 100 characters' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\W]{8,}$/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
  })
  password?: string;
}
