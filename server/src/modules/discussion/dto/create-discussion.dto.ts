import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsArray, IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

/**
 * DTO for creating a new discussion
 */
export class CreateDiscussionDto {
  @ApiProperty({
    description: 'Main content of the discussion',
    example: 'I am trying to understand how JWT authentication works in NestJS. Can someone explain the flow?',
    minLength: 10,
    maxLength: 1000,
  })
  @IsString({ message: 'Content must be a string' })
  @IsNotEmpty({ message: 'Content is required' })
  @MinLength(10, { message: 'Content must be at least 10 characters' })
  @MaxLength(1000, { message: 'Content cannot exceed 1000 characters' })
  @Transform(({ value }) => value?.trim())
  content: string;

  @ApiPropertyOptional({
    description: 'Whether to hide the author identity',
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
    description: 'Tags/categories for the discussion',
    example: ['nestjs', 'authentication', 'jwt'],
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
    description: 'ID of the space this discussion belongs to',
    example: 1,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'spaceId must be a number' })
  spaceId?: number;
}
