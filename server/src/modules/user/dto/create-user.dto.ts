import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString, Length, Matches, MaxLength } from 'class-validator';
import { UserRole } from '../../../common/enums/user-role.enum';

export class CreateUserDto {
  @ApiProperty({
    description: 'Username for login (use nim for students)',
    example: '2110511091',
    minLength: 3,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @Length(3, 100)
  @Matches(/^\d+$/, { message: 'Username can only contain numeric characters' })
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
    example: 'John Doe',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  fullName: string;

  @ApiPropertyOptional({
    description: 'User role',
    enum: UserRole,
    enumName: 'UserRole',
    default: UserRole.STUDENT,
    example: UserRole.STUDENT,
  })
  @IsEnum(UserRole)
  role?: UserRole = UserRole.STUDENT;
}
