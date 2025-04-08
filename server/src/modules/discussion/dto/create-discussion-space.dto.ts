import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, ValidateIf } from 'class-validator';
import { SpaceType } from '../entities/discussion-space.entity';

export class CreateDiscussionSpaceDto {
  @ApiProperty({ description: 'Name of the discussion space', example: 'Web Development' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({
    description: 'Description of the space',
    example: 'A space for discussing web development topics',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'URL-friendly slug for the space', example: 'web-development' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Transform(({ value }) => value.toLowerCase().replace(/\s+/g, '-'))
  slug: string;

  @ApiProperty({
    enum: SpaceType,
    enumName: 'SpaceType',
    description: 'Type of discussion space',
    example: SpaceType.ACADEMIC,
  })
  @IsEnum(SpaceType)
  @IsNotEmpty()
  spaceType: SpaceType;

  @ApiPropertyOptional({
    description: 'Faculty ID (required for FACULTY and STUDY_PROGRAM space types)',
    example: 1,
  })
  @IsNumber()
  @IsOptional()
  @ValidateIf((o) => o.spaceType === SpaceType.FACULTY || o.spaceType === SpaceType.STUDY_PROGRAM)
  @IsNotEmpty({ message: 'Faculty ID is required for FACULTY and STUDY_PROGRAM space types' })
  @Transform(({ value }) => (value ? parseInt(value, 10) : null))
  facultyId?: number;

  @ApiPropertyOptional({
    description: 'Study Program ID (required for STUDY_PROGRAM space type)',
    example: 1,
  })
  @IsNumber()
  @IsOptional()
  @ValidateIf((o) => o.spaceType === SpaceType.STUDY_PROGRAM)
  @IsNotEmpty({ message: 'Study Program ID is required for STUDY_PROGRAM space type' })
  @Transform(({ value }) => (value ? parseInt(value, 10) : null))
  studyProgramId?: number;
}
