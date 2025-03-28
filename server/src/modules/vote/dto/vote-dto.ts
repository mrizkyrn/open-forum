import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { VoteValue } from '../entities/vote.entity';

export class VoteDto {
  @ApiProperty({
    description: 'Vote value (1 for upvote, -1 for downvote)',
    enum: VoteValue,
    example: 1,
    required: true,
  })
  @IsNotEmpty({ message: 'Vote value is required' })
  @IsEnum(VoteValue, { message: 'Vote value must be either 1 (upvote) or -1 (downvote)' })
  value: VoteValue;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => (value ? parseInt(value, 10) : undefined))
  clientRequestTime?: number;
}
