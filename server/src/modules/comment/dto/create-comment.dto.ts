import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

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

  @ApiProperty({
    description: 'IDs of mentioned users',
    example: [1, 5, 8],
    required: false,
    type: [Number],
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map((id) => parseInt(id, 10));
    }
    return value;
  })
  @IsArray()
  mentionedUserIds?: number[];

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => (value ? parseInt(value, 10) : undefined))
  clientRequestTime?: number;
}
