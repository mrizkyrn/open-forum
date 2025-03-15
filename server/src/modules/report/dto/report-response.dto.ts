import { ApiProperty } from '@nestjs/swagger';
import { PaginationMetaDto } from '../../../common/dto/pagination-meta.dto';
import { UserResponseDto } from '../../user/dto/user-response.dto';
import { Report, ReportStatus, ReportTargetType } from '../entities/report.entity';

export class ReportTargetDetailsDto {
  @ApiProperty({ description: 'The content of the reported item', example: 'This is the content' })
  content?: string;

  @ApiProperty({ description: 'Author of the reported content' })
  author: {
    id: number;
    username: string;
    fullName: string;
    avatarUrl: string;
  };

  @ApiProperty({ description: 'Creation date of the reported content' })
  createdAt?: Date;

  @ApiProperty({ description: 'Whether the content has been deleted', example: false })
  deleted?: boolean;
}

export class ReportResponseDto {
  @ApiProperty({ description: 'Report ID', example: 1 })
  id: number;

  @ApiProperty({ description: 'Report creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Report last update date' })
  updatedAt: Date;

  @ApiProperty({ description: 'User who submitted the report' })
  reporter: UserResponseDto;

  @ApiProperty({ description: 'Type of content being reported', enum: ReportTargetType })
  targetType: ReportTargetType;

  @ApiProperty({ description: 'ID of the reported content', example: 1 })
  targetId: number;

  @ApiProperty({ description: 'Details of the reported content' })
  targetDetails: ReportTargetDetailsDto;

  @ApiProperty({ description: 'Reason for reporting' })
  reason: {
    id: number;
    name: string;
    description: string;
  };

  @ApiProperty({ description: 'Additional description provided by the reporter', example: 'This is offensive content' })
  description: string;

  @ApiProperty({ description: 'Current status of the report', enum: ReportStatus })
  status: ReportStatus;

  @ApiProperty({ description: 'User who reviewed the report', required: false })
  reviewer?: UserResponseDto;

  @ApiProperty({ description: 'Date when the report was reviewed', required: false })
  reviewedAt?: Date;

  static fromEntity(report: Report): ReportResponseDto {
    const dto = new ReportResponseDto();

    dto.id = report.id;
    dto.createdAt = report.createdAt;
    dto.updatedAt = report.updatedAt;
    dto.reporter = report.reporter && UserResponseDto.fromEntity(report.reporter);
    dto.targetType = report.targetType;
    dto.targetId = report.targetId;
    dto.targetDetails = report['targetDetails'] || { deleted: true };
    dto.reason = report.reason && {
      id: report.reason.id,
      name: report.reason.name,
      description: report.reason.description,
    };
    dto.description = report.description;
    dto.status = report.status;
    dto.reviewer = report.reviewer && UserResponseDto.fromEntity(report.reviewer);
    dto.reviewedAt = report.reviewedAt || undefined;

    return dto;
  }
}

export class PageableReportResponseDto {
  @ApiProperty({
    type: ReportResponseDto,
    description: 'List of reports',
    isArray: true,
  })
  items: ReportResponseDto[];

  @ApiProperty({
    type: PaginationMetaDto,
    description: 'Pagination metadata',
  })
  meta: PaginationMetaDto;
}

export class ReportReasonResponseDto {
  @ApiProperty({ description: 'Reason ID', example: 1 })
  id: number;

  @ApiProperty({ description: 'Reason name', example: 'Spam' })
  name: string;

  @ApiProperty({ description: 'Reason description', example: 'This content is spam' })
  description: string;

  @ApiProperty({ description: 'Whether the reason is active', example: true })
  isActive: boolean;

  @ApiProperty({ description: 'Date when the reason was created' })
  createdAt: Date;

  @ApiProperty({ description: 'Date when the reason was last updated' })
  updatedAt: Date;

  static fromEntity(reason: ReportReasonResponseDto): ReportReasonResponseDto {
    const dto = new ReportReasonResponseDto();

    dto.id = reason.id;
    dto.name = reason.name;
    dto.description = reason.description;
    dto.isActive = reason.isActive;
    dto.createdAt = reason.createdAt;
    dto.updatedAt = reason.updatedAt;

    return dto;
  }
}

export class ReportStatsResponseDto {
  @ApiProperty({ description: 'Total number of reports', example: 10 })
  total: number;

  @ApiProperty({ description: 'Number of pending reports', example: 5 })
  pending: number;

  @ApiProperty({ description: 'Number of resolved reports', example: 3 })
  resolved: number;

  @ApiProperty({ description: 'Number of dismissed reports', example: 2 })
  dismissed: number;
}
