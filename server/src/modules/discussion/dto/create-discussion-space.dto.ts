import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { SpaceType } from '../entities/discussion-space.entity';

/**
 * DTO for creating a new discussion space
 */
export class CreateDiscussionSpaceDto {
  @ApiProperty({ description: 'Name of the discussion space', example: 'Web Development', maxLength: 100 })
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name is required' })
  @MaxLength(100, { message: 'Name must not exceed 100 characters' })
  @Transform(({ value }) => value?.trim())
  name: string;

  @ApiPropertyOptional({
    description: 'Description of the space',
    example: 'A space for discussing web development topics',
    maxLength: 255,
  })
  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  @MaxLength(255, { message: 'Description must not exceed 255 characters' })
  @Transform(({ value }) => value?.trim())
  description?: string;

  @ApiProperty({ description: 'URL-friendly slug for the space', example: 'web-development', maxLength: 100 })
  @IsString({ message: 'Slug must be a string' })
  @IsNotEmpty({ message: 'Slug is required' })
  @MaxLength(100, { message: 'Slug must not exceed 100 characters' })
  @Transform(({ value }) => value?.toLowerCase().replace(/\s+/g, '-'))
  slug: string;

  @ApiProperty({
    enum: SpaceType,
    enumName: 'SpaceType',
    description: 'Type of discussion space',
    example: SpaceType.GENERAL,
  })
  @IsEnum(SpaceType, { message: 'spaceType must be a valid SpaceType' })
  @IsNotEmpty({ message: 'spaceType is required' })
  spaceType: SpaceType;
}
