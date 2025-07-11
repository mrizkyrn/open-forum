import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ReqUser } from '../../common/decorators/user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../user/entities/user.entity';
import { VoteCountsResponseDto, VoteDto, VoteResponseDto } from './dto';
import { VoteEntityType } from './entities/vote.entity';
import { VoteService } from './vote.service';

/**
 * Vote Controller
 *
 * Handles all vote-related HTTP requests including:
 * - Voting on discussions and comments
 * - Retrieving vote counts and status
 * - Managing user vote preferences
 * - Vote analytics and reporting
 */
@ApiTags('Votes')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class VoteController {
  constructor(private readonly voteService: VoteService) {}

  // ==================== DISCUSSION VOTE OPERATIONS ====================

  @Post('discussions/:discussionId/votes')
  @ApiOperation({
    summary: 'Vote on a discussion',
    description:
      'Cast an upvote or downvote on a discussion. If the same vote already exists, it will be removed (toggle behavior). If a different vote exists, it will be changed.',
  })
  @ApiParam({
    name: 'discussionId',
    description: 'Discussion ID',
    type: Number,
    example: 1,
  })
  @ApiBody({
    type: VoteDto,
    description: 'Vote data containing the vote value (1 for upvote, -1 for downvote)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Vote registered successfully or removed if toggled',
    type: VoteResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid vote value or vote cooldown in effect',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication required',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Discussion not found',
  })
  @HttpCode(HttpStatus.OK)
  async voteOnDiscussion(
    @Param('discussionId', ParseIntPipe) discussionId: number,
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    voteDto: VoteDto,
    @ReqUser() currentUser: User,
  ): Promise<VoteResponseDto | null> {
    return this.voteService.voteDiscussion(currentUser.id, discussionId, voteDto);
  }

  @Get('discussions/:discussionId/votes')
  @ApiOperation({
    summary: 'Get vote counts for a discussion',
    description: 'Retrieve the total number of upvotes, downvotes, and overall vote count for a specific discussion',
  })
  @ApiParam({
    name: 'discussionId',
    description: 'Discussion ID',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully retrieved vote counts',
    type: VoteCountsResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication required',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Discussion not found',
  })
  async getDiscussionVoteCounts(
    @Param('discussionId', ParseIntPipe) discussionId: number,
  ): Promise<VoteCountsResponseDto> {
    return this.voteService.getVoteCounts(VoteEntityType.DISCUSSION, discussionId);
  }

  @Get('discussions/:discussionId/votes/status')
  @ApiOperation({
    summary: 'Get current user vote status for a discussion',
    description: 'Check if the current user has voted on a discussion and what type of vote they cast',
  })
  @ApiParam({
    name: 'discussionId',
    description: 'Discussion ID',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully retrieved user vote status',
    schema: {
      type: 'object',
      properties: {
        voteValue: {
          type: 'number',
          nullable: true,
          description: 'Vote value: 1 for upvote, -1 for downvote, null if not voted',
          example: 1,
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication required',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Discussion not found',
  })
  async getDiscussionVoteStatus(
    @Param('discussionId', ParseIntPipe) discussionId: number,
    @ReqUser() currentUser: User,
  ): Promise<{ voteValue: number | null }> {
    const voteValue = await this.voteService.getUserVoteStatus(currentUser.id, VoteEntityType.DISCUSSION, discussionId);
    return { voteValue };
  }

  // ==================== COMMENT VOTE OPERATIONS ====================

  @Post('comments/:commentId/votes')
  @ApiOperation({
    summary: 'Vote on a comment',
    description:
      'Cast an upvote or downvote on a comment. If the same vote already exists, it will be removed (toggle behavior). If a different vote exists, it will be changed.',
  })
  @ApiParam({
    name: 'commentId',
    description: 'Comment ID',
    type: Number,
    example: 1,
  })
  @ApiBody({
    type: VoteDto,
    description: 'Vote data containing the vote value (1 for upvote, -1 for downvote)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Vote registered successfully or removed if toggled',
    type: VoteResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid vote value or vote cooldown in effect',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication required',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Comment not found',
  })
  @HttpCode(HttpStatus.OK)
  async voteOnComment(
    @Param('commentId', ParseIntPipe) commentId: number,
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    voteDto: VoteDto,
    @ReqUser() currentUser: User,
  ): Promise<VoteResponseDto | null> {
    return this.voteService.voteComment(currentUser.id, commentId, voteDto);
  }

  @Get('comments/:commentId/votes')
  @ApiOperation({
    summary: 'Get vote counts for a comment',
    description: 'Retrieve the total number of upvotes, downvotes, and overall vote count for a specific comment',
  })
  @ApiParam({
    name: 'commentId',
    description: 'Comment ID',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully retrieved vote counts',
    type: VoteCountsResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication required',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Comment not found',
  })
  async getCommentVoteCounts(@Param('commentId', ParseIntPipe) commentId: number): Promise<VoteCountsResponseDto> {
    return this.voteService.getVoteCounts(VoteEntityType.COMMENT, commentId);
  }

  @Get('comments/:commentId/votes/status')
  @ApiOperation({
    summary: 'Get current user vote status for a comment',
    description: 'Check if the current user has voted on a comment and what type of vote they cast',
  })
  @ApiParam({
    name: 'commentId',
    description: 'Comment ID',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully retrieved user vote status',
    schema: {
      type: 'object',
      properties: {
        voteValue: {
          type: 'number',
          nullable: true,
          description: 'Vote value: 1 for upvote, -1 for downvote, null if not voted',
          example: -1,
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication required',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Comment not found',
  })
  async getCommentVoteStatus(
    @Param('commentId', ParseIntPipe) commentId: number,
    @ReqUser() currentUser: User,
  ): Promise<{ voteValue: number | null }> {
    const voteValue = await this.voteService.getUserVoteStatus(currentUser.id, VoteEntityType.COMMENT, commentId);
    return { voteValue };
  }
}
