import { ApiProperty } from '@nestjs/swagger';
import { ReportStatus, ReportTargetType } from '../entities/report.entity';
import { Pageable } from '../../../common/interfaces/pageable.interface';
import { UserResponseDto } from 'src/modules/user/dto/user-response.dto';
import { PaginationMetaDto } from 'src/common/dto/pagination-meta.dto';

export class ReportTargetDetailsDto {
  @ApiProperty({ description: 'The content of the reported item', example: 'This is the content' })
  content?: string;

  @ApiProperty({ description: 'Author of the reported content' })
  author?: UserResponseDto;

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
}
