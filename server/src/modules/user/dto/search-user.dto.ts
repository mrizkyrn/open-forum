import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsOptional } from 'class-validator';
import { SearchDto } from '../../../common/dto/search.dto';
import { UserRole } from '../../../common/enums/user-role.enum';

/**
 * Available fields for sorting users
 */
export enum UserSortBy {
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  USERNAME = 'username',
  FULL_NAME = 'fullName',
  ROLE = 'role',
  LAST_ACTIVE_AT = 'lastActiveAt',
}

/**
 * DTO for searching and filtering users with pagination
 */
export class SearchUserDto extends SearchDto {
  @ApiPropertyOptional({
    description: 'Filter users by role',
    enum: UserRole,
    enumName: 'UserRole',
    example: UserRole.USER,
  })
  @IsOptional()
  @IsEnum(UserRole, { message: 'Role must be a valid user role' })
  @Type(() => String)
  role?: UserRole;

  @ApiPropertyOptional({
    description: 'Field to sort users by',
    enum: UserSortBy,
    enumName: 'UserSortBy',
    default: UserSortBy.CREATED_AT,
    example: UserSortBy.CREATED_AT,
  })
  @IsOptional()
  @IsEnum(UserSortBy, { message: 'Sort field must be a valid user field' })
  @Type(() => String)
  sortBy: UserSortBy = UserSortBy.CREATED_AT;
}
