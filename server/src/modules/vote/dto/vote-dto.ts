import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
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
}
