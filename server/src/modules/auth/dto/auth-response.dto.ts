import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../../common/enums/user-role.enum';

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

  @ApiProperty({ description: 'Creation date of the user account', example: '2021-09-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date of the user account', example: '2021-09-01T00:00:00.000Z' })
  updatedAt: Date;
}

export class LoginResponseDto {
  @ApiProperty({ description: 'User information' })
  user: UserResponseDto;

  @ApiProperty({
    description: 'JWT access token for API authentication',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;
}

export class TokenResponseDto {
  @ApiProperty({
    description: 'JWT access token for API authentication',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;
}
