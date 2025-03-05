import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateCommentDto {
  @ApiProperty({
    description: 'Updated comment content',
    example: 'This is my updated comment',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  content?: string;

  @ApiProperty({
    description: 'IDs of attachments to remove',
    example: [1, 2],
    type: [Number],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @Transform(({ value }) => {
    return Array.isArray(value) ? value : typeof value === 'string' ? value.split(',').map((id) => +id) : [];
  })
  attachmentsToRemove?: number[];
}
