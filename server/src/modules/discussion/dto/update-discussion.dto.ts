import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * DTO for updating a discussion
 */
export class UpdateDiscussionDto {
  @ApiPropertyOptional({
    description: 'Discussion content',
    example: 'Updated discussion content',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString({ message: 'Content must be a string' })
  @MaxLength(1000, { message: 'Content cannot exceed 1000 characters' })
  @Transform(({ value }) => value?.trim())
  content?: string;

  @ApiPropertyOptional({
    description: 'Whether the discussion is anonymous',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'isAnonymous must be a boolean' })
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  isAnonymous?: boolean = false;

  @ApiPropertyOptional({
    description: 'Discussion tags',
    example: ['tag1', 'tag2'],
    type: [String],
    isArray: true,
  })
  @IsOptional()
  @IsArray({ message: 'Tags must be an array' })
  @IsString({ each: true, message: 'Each tag must be a string' })
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

  @ApiPropertyOptional({
    description: 'IDs of attachments to remove',
    example: [1, 2],
    type: [Number],
    isArray: true,
  })
  @IsOptional()
  @IsArray({ message: 'attachmentsToRemove must be an array' })
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value.map((id) => Number(id));
    if (typeof value === 'string') {
      return value
        .split(',')
        .map((id) => Number(id.trim()))
        .filter((id) => !isNaN(id));
    }
    return [];
  })
  attachmentsToRemove?: number[];
}
