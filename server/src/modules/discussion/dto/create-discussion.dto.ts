import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateDiscussionDto {
  @ApiProperty({
    description: 'Main content of the discussion',
    example: 'I am trying to understand how JWT authentication works in NestJS. Can someone explain the flow?',
    minLength: 10,
    maxLength: 10000,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10, { message: 'Content must be at least 10 characters' })
  @MaxLength(1000, { message: 'Content cannot exceed 1000 characters' })
  content: string;

  @ApiPropertyOptional({
    description: 'Whether to hide the author identity',
    example: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  isAnonymous: boolean = false;

  @ApiPropertyOptional({
    description: 'Tags/categories for the discussion',
    example: ['nestjs', 'authentication', 'jwt'],
    type: [String],
    isArray: true,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
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
  })
  @IsNumber()
  @Transform(({ value }) => (value ? parseInt(value, 10) : undefined))
  spaceId: number;
}
