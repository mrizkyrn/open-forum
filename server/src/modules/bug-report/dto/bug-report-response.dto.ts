import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Transform, Type } from 'class-transformer';
import { PaginationMetaDto } from '../../../common/dto/pagination-meta.dto';
import { UserResponseDto } from '../../user/dto';
import { BugPriority, BugReport, BugStatus } from '../entities/bug-report.entity';

/**
 * Base bug report response DTO
 */
@Exclude()
export class BugReportResponseDto {
  @ApiProperty({
    description: 'Unique bug report identifier',
    example: 1,
  })
  @Expose()
  @Type(() => Number)
  id: number;

  @ApiProperty({
    description: 'Bug report title',
    example: 'Login button not working on mobile',
  })
  @Expose()
  title: string;

  @ApiProperty({
    description: 'Detailed description of the bug',
    example: 'When trying to login on mobile devices, the login button becomes unresponsive.',
  })
  @Expose()
  description: string;

  @ApiProperty({
    description: 'Steps to reproduce the bug',
    example: '1. Open app on mobile\n2. Navigate to login\n3. Enter credentials',
    nullable: true,
  })
  @Expose()
  stepsToReproduce: string | null;

  @ApiProperty({
    description: 'Environment where bug occurred',
    example: 'iOS 15.0, Safari',
    nullable: true,
  })
  @Expose()
  environment: string | null;

  @ApiProperty({
    description: 'Priority level of the bug',
    enum: BugPriority,
    example: BugPriority.HIGH,
  })
  @Expose()
  priority: BugPriority;

  @ApiProperty({
    description: 'Current status of the bug report',
    enum: BugStatus,
    example: BugStatus.OPEN,
  })
  @Expose()
  status: BugStatus;

  @ApiProperty({
    description: 'User who reported the bug',
    type: UserResponseDto,
  })
  @Expose()
  @Type(() => UserResponseDto)
  reporter: UserResponseDto;

  @ApiProperty({
    description: 'User assigned to fix the bug',
    type: UserResponseDto,
    nullable: true,
  })
  @Expose()
  @Type(() => UserResponseDto)
  assignedTo: UserResponseDto | null;

  @ApiProperty({
    description: 'Resolution notes or comments',
    example: 'Fixed by updating the mobile CSS styles',
    nullable: true,
  })
  @Expose()
  resolution: string | null;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  @Expose()
  @Transform(({ value }) => value?.toISOString())
  createdAt: string;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  @Expose()
  @Transform(({ value }) => value?.toISOString())
  updatedAt: string;

  /**
   * Create response DTO from entity
   */
  static fromEntity(entity: BugReport): BugReportResponseDto {
    const dto = new BugReportResponseDto();
    Object.assign(dto, entity);
    return dto;
  }

  /**
   * Create array of response DTOs from entities
   */
  static fromEntities(entities: BugReport[]): BugReportResponseDto[] {
    return entities.map((entity) => this.fromEntity(entity));
  }
}

/**
 * Pageable bug report response DTO
 */
export class PageableBugReportResponseDto {
  @ApiProperty({
    description: 'Array of bug reports',
    type: [BugReportResponseDto],
  })
  @Type(() => BugReportResponseDto)
  data: BugReportResponseDto[];

  @ApiProperty({
    description: 'Pagination metadata',
    type: PaginationMetaDto,
  })
  @Type(() => PaginationMetaDto)
  meta: PaginationMetaDto;
}
