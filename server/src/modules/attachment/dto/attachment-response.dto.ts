import { ApiProperty } from '@nestjs/swagger';
import { AttachmentType } from '../entities/attachment.entity';

export class AttachmentResponseDto {
  @ApiProperty({
    description: 'Unique identifier of the attachment',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Original file name uploaded by the user',
    example: 'presentation.png',
  })
  originalName: string;

  @ApiProperty({
    description: 'MIME type of the file',
    example: 'application/pdf',
  })
  mimeType: string;

  @ApiProperty({
    description: 'File size in bytes',
    example: 1048576,
  })
  size: number;

  @ApiProperty({
    description: 'URL path to access the file',
    example: '/uploads/2023/07/1689345678912-uuid.pdf',
  })
  url: string;

  @ApiProperty({
    description: 'Type of entity this attachment belongs to',
    enum: AttachmentType,
    example: AttachmentType.DISCUSSION,
  })
  entityType: AttachmentType;

  @ApiProperty({
    description: 'ID of the parent entity',
    example: 42,
  })
  entityId: number;

  @ApiProperty({
    description: 'Whether the attachment is an image file',
    example: false,
  })
  isImage: boolean;

  @ApiProperty({
    description: 'Display order among multiple attachments',
    example: 0,
  })
  displayOrder: number;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2023-07-15T10:30:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2023-07-15T10:30:00Z',
  })
  updatedAt: Date;
}
