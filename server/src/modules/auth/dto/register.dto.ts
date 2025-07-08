import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsOptional, IsString, IsUrl, Length, Matches, MaxLength } from 'class-validator';

export class RegisterDto {
  @ApiPropertyOptional({
    description: 'Email address (optional)',
    example: 'john.doe@example.com',
    maxLength: 100,
  })
  @IsEmail()
  @IsOptional()
  @MaxLength(100)
  email?: string;

  @ApiProperty({
    description: 'Username for login',
    example: 'johndoe',
    minLength: 3,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @Length(3, 100)
  @Transform(({ value }) => value?.toLowerCase().trim())
  username: string;

  @ApiProperty({
    description: 'User password (will be hashed)',
    example: 'StrongP@ssw0rd',
    minLength: 8,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @Length(8, 100)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\W]{8,}$/, {
    message: 'Password must contain at least 8 characters, including upper and lowercase letters and numbers',
  })
  password: string;

  @ApiProperty({
    description: 'Full name of the user',
    example: 'Mochamad Rizky Ramadhan',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  fullName: string;

  @ApiPropertyOptional({
    description: 'Profile picture URL (optional)',
    example: 'https://example.com/avatar.jpg',
    maxLength: 255,
  })
  @IsOptional()
  @IsUrl()
  @MaxLength(255)
  avatarUrl?: string;
}
