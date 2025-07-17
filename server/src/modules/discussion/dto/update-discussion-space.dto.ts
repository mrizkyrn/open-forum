import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { SpaceType } from '../entities/discussion-space.entity';

export class UpdateDiscussionSpaceDto {
  @ApiPropertyOptional({ description: 'Name of the discussion space', example: 'Web Development', maxLength: 100 })
  @IsOptional()
  @IsString({ message: 'Name must be a string' })
  @MaxLength(100, { message: 'Name must not exceed 100 characters' })
  @Transform(({ value }) => value?.trim())
  name?: string;

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

  @ApiPropertyOptional({ description: 'URL-friendly slug for the space', example: 'web-development', maxLength: 100 })
  @IsOptional()
  @IsString({ message: 'Slug must be a string' })
  @MaxLength(100, { message: 'Slug must not exceed 100 characters' })
  @Transform(({ value }) => value?.toLowerCase().replace(/\s+/g, '-'))
  slug?: string;

  @ApiPropertyOptional({
    enum: SpaceType,
    enumName: 'SpaceType',
    description: 'Type of discussion space',
    example: SpaceType.GENERAL,
  })
  @IsOptional()
  @IsEnum(SpaceType, { message: 'spaceType must be a valid SpaceType' })
  spaceType?: SpaceType;

  @ApiPropertyOptional({ description: 'Remove the icon from the space' })
  @IsOptional()
  @IsBoolean({ message: 'removeIcon must be a boolean' })
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  removeIcon?: boolean;

  @ApiPropertyOptional({ description: 'Remove the banner from the space' })
  @IsOptional()
  @IsBoolean({ message: 'removeBanner must be a boolean' })
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  removeBanner?: boolean;
}
