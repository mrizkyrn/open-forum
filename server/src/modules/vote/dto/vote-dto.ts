import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { VoteValue } from '../entities/vote.entity';

/**
 * Vote creation/update DTO
 *
 * Used for casting or changing a vote on an entity (discussion or comment).
 * Contains validation to ensure only valid vote values are accepted.
 */
export class VoteDto {
  @ApiProperty({
    description: 'Vote value - 1 for upvote, -1 for downvote',
    enum: VoteValue,
    enumName: 'VoteValue',
    example: VoteValue.UPVOTE,
    required: true,
  })
  @IsNotEmpty({ message: 'Vote value is required' })
  @IsEnum(VoteValue, {
    message: 'Vote value must be either 1 (upvote) or -1 (downvote)',
  })
  @Transform(({ value }) => {
    // Ensure the value is properly typed as number
    const numValue = Number(value);
    return numValue === 1 ? VoteValue.UPVOTE : numValue === -1 ? VoteValue.DOWNVOTE : value;
  })
  value: VoteValue;
}
