import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateCommentDto {
  @ApiProperty({
    description: 'This is interesting topic',
    example: 'This is my comment',
  })
  @IsString()
  @MaxLength(5000)
  content: string;

  @ApiProperty({
    description: 'ID of the parent comment (if this is a reply)',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => (value ? parseInt(value, 10) : null))
  parentId?: number;
}
