import { ApiProperty } from '@nestjs/swagger';
import { VoteValue } from '../entities/vote.entity';

export class VoteResponseDto {
  @ApiProperty({
    description: 'Vote value (1 for upvote, -1 for downvote)',
    enum: VoteValue,
    example: 1,
  })
  value: VoteValue;

  @ApiProperty({
    description: 'Entity type',
    example: 'discussion',
  })
  entityType: string;

  @ApiProperty({
    description: 'Entity ID',
    example: 1,
  })
  entityId: number;

  @ApiProperty({
    description: 'User ID',
    example: 42,
  })
  userId: number;

  @ApiProperty({
    description: 'Creation date',
    example: '2023-01-01T00:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update date',
    example: '2023-01-01T00:00:00Z',
  })
  updatedAt: Date;
}

export class VoteCountsDto {
  @ApiProperty({
    description: 'Number of upvotes',
    example: 42,
  })
  upvotes: number;

  @ApiProperty({
    description: 'Number of downvotes',
    example: 5,
  })
  downvotes: number;
}
