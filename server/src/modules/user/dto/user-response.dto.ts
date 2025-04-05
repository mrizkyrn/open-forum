import { ApiProperty } from '@nestjs/swagger';
import { PaginationMetaDto } from '../../../common/dto/pagination-meta.dto';
import { UserRole } from '../../../common/enums/user-role.enum';
import { FacultyResponseDto } from '../../../modules/academic/dto/faculty-response.dto';
import { StudyProgramResponseDto } from '../../../modules/academic/dto/study-program-response.dto';
import { User } from '../entities/user.entity';

export class UserResponseDto {
  @ApiProperty({ description: 'User ID', example: 1 })
  id: number;

  @ApiProperty({ description: 'Username', example: '2110511091' })
  username: string;

  @ApiProperty({ description: 'Full name of the user', example: 'Mochamad Rizky Ramadhan' })
  fullName: string;

  @ApiProperty({ description: 'Gender', example: 'L', nullable: true })
  gender: string | null;

  @ApiProperty({ description: 'Batch year', example: '2021', nullable: true })
  batchYear: string | null;

  @ApiProperty({ description: 'Study program name', example: 'S1 Informatika' })
  studyProgramName: string;

  @ApiProperty({ description: 'Faculty name', example: 'Fakultas Ilmu Komputer' })
  facultyName: string;

  @ApiProperty({
    description: 'User role',
    enum: UserRole,
    example: 'student',
  })
  role: UserRole;

  @ApiProperty({ description: 'URL of the user avatar', example: 'https://example.com/avatar.jpg', nullable: true })
  avatarUrl?: string | null;

  @ApiProperty({ description: 'User last active date', example: '2021-09-01T00:00:00.000Z' })
  lastActiveAt?: Date | null;

  @ApiProperty({ description: 'Creation date of the user account', example: '2021-09-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date of the user account', example: '2021-09-01T00:00:00.000Z' })
  updatedAt: Date;

  static fromEntity(user: User): UserResponseDto {
    const dto = new UserResponseDto();
    dto.id = user.id;
    dto.username = user.username;
    dto.fullName = user.fullName;
    dto.gender = user.gender;
    dto.batchYear = user.batchYear;
    dto.role = user.role;
    dto.avatarUrl = user.avatarUrl;
    dto.lastActiveAt = user.lastActiveAt;
    dto.createdAt = user.createdAt;
    dto.updatedAt = user.updatedAt;

    return dto;
  }

  static createAnonymous(userId?: number): UserResponseDto {
    const dto = new UserResponseDto();

    if (userId) {
      dto.id = userId;
      dto.username = '(You - Anonymous)';
      dto.fullName = '(You - Anonymous)';
    } else {
      dto.username = 'Anonymous';
      dto.fullName = 'Anonymous';
    }

    dto.avatarUrl = null;

    return dto;
  }
}

export class UserDetailResponseDto {
  @ApiProperty({ description: 'User ID', example: 1 })
  id: number;

  @ApiProperty({ description: 'Username', example: '2110511091' })
  username: string;

  @ApiProperty({ description: 'Full name of the user', example: 'Mochamad Rizky Ramadhan' })
  fullName: string;

  @ApiProperty({ description: 'Gender', example: 'L', nullable: true })
  gender: string | null;

  @ApiProperty({ description: 'Batch year', example: '2021', nullable: true })
  batchYear: string | null;

  @ApiProperty({ description: 'Education level', example: 'S.1', nullable: true })
  educationLevel: string | null;

  @ApiProperty({ type: StudyProgramResponseDto, nullable: true })
  studyProgram: StudyProgramResponseDto | null;

  @ApiProperty({ type: FacultyResponseDto, nullable: true })
  faculty: FacultyResponseDto | null;

  @ApiProperty({ description: 'Email address', example: 'user@example.com', nullable: true })
  email: string | null;

  @ApiProperty({ description: 'Phone number', example: '087881311283', nullable: true })
  phone: string | null;

  @ApiProperty({
    description: 'User role',
    enum: UserRole,
    example: 'student',
  })
  role: UserRole;

  @ApiProperty({ description: 'URL of the user avatar', example: 'https://example.com/avatar.jpg', nullable: true })
  avatarUrl: string | null;

  @ApiProperty({ description: 'User last active date', example: '2021-09-01T00:00:00.000Z', nullable: true })
  lastActiveAt: Date | null;

  @ApiProperty({ description: 'Creation date of the user account', example: '2021-09-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date of the user account', example: '2021-09-01T00:00:00.000Z' })
  updatedAt: Date;

  static fromEntity(user: User): UserDetailResponseDto {
    const dto = new UserDetailResponseDto();
    dto.id = user.id;
    dto.username = user.username;
    dto.fullName = user.fullName;
    dto.gender = user.gender;
    dto.batchYear = user.batchYear;
    dto.educationLevel = user.educationLevel;

    if (user.studyProgram) {
      dto.studyProgram = StudyProgramResponseDto.fromEntity(user.studyProgram, false);
      if (user.studyProgram.faculty) {
        dto.faculty = FacultyResponseDto.fromEntity(user.studyProgram.faculty);
      }
    }

    dto.email = user.email;
    dto.phone = user.phone;
    dto.role = user.role;
    dto.avatarUrl = user.avatarUrl;
    dto.lastActiveAt = user.lastActiveAt;
    dto.createdAt = user.createdAt;
    dto.updatedAt = user.updatedAt;

    return dto;
  }
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
