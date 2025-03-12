import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../../common/enums/user-role.enum';
import { PaginationMetaDto } from '../../../common/dto/pagination-meta.dto';

export class UserResponseDto {
  @ApiProperty({ description: 'User ID', example: 1 })
  id: number;

  @ApiProperty({ description: 'Username', example: '2110511091' })
  username: string;

  @ApiProperty({ description: 'Full name of the user', example: 'Mochamad Rizky Ramadhan' })
  fullName: string;

  @ApiProperty({
    description: 'User role',
    enum: UserRole,
    example: 'student',
  })
  role: UserRole;

  @ApiProperty({ description: 'URL of the user avatar', example: 'https://example.com/avatar.jpg', nullable: true })
  avatarUrl?: string | null;

  @ApiProperty({ description: 'User last active date', example: '2021-09-01T00:00:00.000Z' })
  lastActiveAt?: Date;

  @ApiProperty({ description: 'Creation date of the user account', example: '2021-09-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date of the user account', example: '2021-09-01T00:00:00.000Z' })
  updatedAt: Date;
}

export class PageableUserResponseDto {
  @ApiProperty({
    type: UserResponseDto,
    description: 'List of users',
    isArray: true,
  })
  items: UserResponseDto[];

  @ApiProperty({
    type: PaginationMetaDto,
    description: 'Pagination metadata',
  })
  meta: PaginationMetaDto;
}
