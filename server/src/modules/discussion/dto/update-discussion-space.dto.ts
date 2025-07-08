import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { SpaceType } from '../entities/discussion-space.entity';

export class UpdateDiscussionSpaceDto {
  @ApiPropertyOptional({ description: 'Name of the discussion space', example: 'Web Development' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    description: 'Description of the space',
    example: 'A space for discussing web development topics',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'URL-friendly slug for the space', example: 'web-development' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  @Transform(({ value }) => value?.toLowerCase().replace(/\s+/g, '-'))
  slug?: string;

  @ApiPropertyOptional({
    enum: SpaceType,
    enumName: 'SpaceType',
    description: 'Type of discussion space',
    example: SpaceType.ACADEMIC,
  })
  @IsEnum(SpaceType)
  @IsOptional()
  spaceType?: SpaceType;

  @ApiPropertyOptional({ description: 'Remove the icon from the space' })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  removeIcon?: boolean;

  @ApiPropertyOptional({ description: 'Remove the banner from the space' })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  removeBanner?: boolean;
}
