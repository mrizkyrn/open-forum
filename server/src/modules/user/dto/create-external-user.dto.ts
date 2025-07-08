import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { UserRole } from '../../../common/enums/user-role.enum';

export class CreateExternalUserDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  email?: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole = UserRole.STUDENT;
}
