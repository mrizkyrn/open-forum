import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

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
}
