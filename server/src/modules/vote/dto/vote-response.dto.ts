import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, Transform, Type } from 'class-transformer';
import { UserResponseDto } from '../../user/dto/user-response.dto';
import { Vote, VoteEntityType, VoteValue } from '../entities/vote.entity';

/**
 * Vote response DTO
 *
 * Contains vote information including the vote value, target entity details,
 * and associated user information.
 */
@Exclude()
export class VoteResponseDto {
  @ApiProperty({
    description: 'Unique vote identifier',
    example: 1,
    type: Number,
  })
  @Expose()
  @Type(() => Number)
  id: number;

  @ApiProperty({
    description: 'Vote value - 1 for upvote, -1 for downvote',
    enum: VoteValue,
    enumName: 'VoteValue',
    example: VoteValue.UPVOTE,
  })
  @Expose()
  value: VoteValue;

  @ApiProperty({
    description: 'Type of entity being voted on',
    enum: VoteEntityType,
    enumName: 'VoteEntityType',
    example: VoteEntityType.DISCUSSION,
  })
  @Expose()
  entityType: VoteEntityType;

  @ApiProperty({
    description: 'ID of the entity being voted on',
    example: 123,
    type: Number,
  })
  @Expose()
  @Type(() => Number)
  entityId: number;

  @ApiProperty({
    description: 'ID of the user who cast the vote',
    example: 42,
    type: Number,
  })
  @Expose()
  @Type(() => Number)
  userId: number;

  @ApiPropertyOptional({
    description: 'User who cast the vote',
    type: UserResponseDto,
  })
  @Expose()
  @Type(() => UserResponseDto)
  user?: UserResponseDto;

  @ApiProperty({
    description: 'Vote creation timestamp',
    example: '2025-01-15T10:30:00.000Z',
    type: Date,
  })
  @Expose()
  @Type(() => Date)
  createdAt: Date;

  @ApiProperty({
    description: 'Vote last update timestamp',
    example: '2025-01-15T10:30:00.000Z',
    type: Date,
  })
  @Expose()
  @Type(() => Date)
  updatedAt: Date;

  @ApiProperty({
    description: 'Human-readable vote description',
    example: 'upvote on discussion 123',
  })
  @Expose()
  @Transform(({ obj }) => {
    const voteType = obj.value === VoteValue.UPVOTE ? 'upvote' : 'downvote';
    return `${voteType} on ${obj.entityType} ${obj.entityId}`;
  })
  description: string;

  @ApiProperty({
    description: 'Whether this is an upvote',
    example: true,
    type: Boolean,
  })
  @Expose()
  @Transform(({ obj }) => obj.value === VoteValue.UPVOTE)
  isUpvote: boolean;

  @ApiProperty({
    description: 'Whether this is a downvote',
    example: false,
    type: Boolean,
  })
  @Expose()
  @Transform(({ obj }) => obj.value === VoteValue.DOWNVOTE)
  isDownvote: boolean;

  @ApiProperty({
    description: 'Whether the vote is recent (within last 24 hours)',
    example: true,
    type: Boolean,
  })
  @Expose()
  @Transform(({ obj }) => {
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
    return new Date(obj.createdAt) > twentyFourHoursAgo;
  })
  isRecentVote: boolean;

  /**
   * Create VoteResponseDto from Vote entity
   */
  static fromEntity(vote: Vote, includeUser = false): VoteResponseDto {
    const dto = new VoteResponseDto();
    dto.id = vote.id;
    dto.value = vote.value;
    dto.entityType = vote.entityType;
    dto.entityId = vote.entityId;
    dto.userId = vote.userId;
    dto.createdAt = vote.createdAt;
    dto.updatedAt = vote.updatedAt;

    // Include user information if requested and available
    if (includeUser && vote.user) {
      dto.user = UserResponseDto.fromEntity(vote.user);
    }

    return dto;
  }

  /**
   * Create VoteResponseDto from partial data
   */
  static create(
    id: number,
    value: VoteValue,
    entityType: VoteEntityType,
    entityId: number,
    userId: number,
    createdAt: Date = new Date(),
    updatedAt: Date = new Date(),
  ): VoteResponseDto {
    const dto = new VoteResponseDto();
    dto.id = id;
    dto.value = value;
    dto.entityType = entityType;
    dto.entityId = entityId;
    dto.userId = userId;
    dto.createdAt = createdAt;
    dto.updatedAt = updatedAt;
    return dto;
  }
}

/**
 * Vote counts DTO
 *
 * Contains aggregated vote statistics for an entity.
 */
@Exclude()
export class VoteCountsResponseDto {
  @ApiProperty({
    description: 'Total number of upvotes',
    example: 42,
    type: Number,
    minimum: 0,
  })
  @Expose()
  @Type(() => Number)
  @Transform(({ value }) => Math.max(0, Number(value) || 0))
  upvotes: number;

  @ApiProperty({
    description: 'Total number of downvotes',
    example: 5,
    type: Number,
    minimum: 0,
  })
  @Expose()
  @Type(() => Number)
  @Transform(({ value }) => Math.max(0, Number(value) || 0))
  downvotes: number;

  @ApiProperty({
    description: 'Total number of votes',
    example: 47,
    type: Number,
    minimum: 0,
  })
  @Expose()
  @Transform(({ obj }) => (obj.upvotes || 0) + (obj.downvotes || 0))
  totalVotes: number;

  /**
   * Create VoteCountsResponseDto from vote count data
   */
  static create(upvotes: number = 0, downvotes: number = 0): VoteCountsResponseDto {
    const dto = new VoteCountsResponseDto();
    dto.upvotes = Math.max(0, upvotes);
    dto.downvotes = Math.max(0, downvotes);
    dto.totalVotes = dto.upvotes + dto.downvotes;
    return dto;
  }
}