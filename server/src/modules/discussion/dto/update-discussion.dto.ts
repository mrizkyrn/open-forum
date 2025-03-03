import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateDiscussionDto {
  @ApiProperty({
    description: 'Discussion content',
    example: 'Updated discussion content',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  content?: string;

  @ApiProperty({
    description: 'Whether the discussion is anonymous',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  isAnonymous?: boolean;

  @ApiProperty({
    description: 'Discussion tags',
    example: ['tag1', 'tag2'],
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean);
    }
    return value;
  })
  tags?: string[];

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
