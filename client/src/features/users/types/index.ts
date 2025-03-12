export enum UserRole {
  ADMIN = 'admin',
  STUDENT = 'student',
  LECTURER = 'lecturer',
}

export interface User {
  id: number;
  username: string;
  fullName: string;
  role: UserRole;
  avatarUrl?: string | null;
  lastActiveAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// import { IsEnum, IsOptional } from 'class-validator';
// import { ApiProperty } from '@nestjs/swagger';
// import { UserRole } from '../../../common/enums/user-role.enum';
// import { SearchDto } from '../../../common/dto/search.dto';

// export enum UserSortBy {
//   createdAt = 'createdAt',
//   updatedAt = 'updatedAt',
//   username = 'username',
//   fullName = 'fullName',
// }

// export class SearchUserDto extends SearchDto {
//   @ApiProperty({
//     description: 'Filter by user role',
//     enum: UserRole,
//     required: false,
//   })
//   @IsOptional()
//   @IsEnum(UserRole)
//   role?: UserRole;

//   @ApiProperty({
//     description: 'Field to sort by',
//     enum: UserSortBy,
//     default: UserSortBy.createdAt,
//     required: false,
//   })
//   @IsOptional()
//   @IsEnum(UserSortBy)
//   sortBy: UserSortBy = UserSortBy.createdAt;
// }

export enum UserSortBy {
  createdAt = 'createdAt',
  updatedAt = 'updatedAt',
  username = 'username',
  fullName = 'fullName',
  role = 'role',
  lastActiveAt = 'lastActiveAt',
}

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export interface SearchUserParams {
  page: number;
  limit: number;
  search?: string;
  sortOrder: SortOrder;
  role?: UserRole;
  sortBy?: UserSortBy;
}
