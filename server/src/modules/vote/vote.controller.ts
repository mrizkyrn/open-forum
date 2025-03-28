import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ReqUser } from '../../common/decorators/user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../user/entities/user.entity';
import { VoteDto } from './dto/vote-dto';
import { VoteCountsDto, VoteResponseDto } from './dto/vote-response.dto';
import { VoteEntityType } from './entities/vote.entity';
import { VoteService } from './vote.service';

@ApiTags('Votes')
@Controller()
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class VoteController {
  constructor(private readonly voteService: VoteService) {}

  // ----- Discussion votes endpoints -----

  @Post('discussions/:discussionId/votes')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Vote on a discussion' })
  @ApiParam({ name: 'discussionId', description: 'Discussion ID', type: Number })
  @ApiBody({ type: VoteDto })
  @ApiResponse({ status: 200, description: 'Vote registered successfully', type: VoteResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Discussion not found' })
  async voteOnDiscussion(
    @Param('discussionId', ParseIntPipe) discussionId: number,
    @Body() voteDto: VoteDto,
    @ReqUser() currentUser: User,
  ): Promise<VoteResponseDto | null> {
    return await this.voteService.voteDiscussion(currentUser.id, discussionId, voteDto);
  }

  @Get('discussions/:discussionId/votes')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get vote counts for a discussion' })
  @ApiParam({ name: 'discussionId', description: 'Discussion ID', type: Number })
  @ApiResponse({ status: 200, description: 'Returns vote counts' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Discussion not found' })
  async getDiscussionVoteCounts(@Param('discussionId', ParseIntPipe) discussionId: number): Promise<VoteCountsDto> {
    return this.voteService.getVoteCounts(VoteEntityType.DISCUSSION, discussionId);
  }

  // ----- Comment votes endpoints -----

  @Post('comments/:commentId/votes')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Vote on a comment' })
  @ApiParam({ name: 'commentId', description: 'Comment ID', type: Number })
  @ApiBody({ type: VoteDto })
  @ApiResponse({ status: 200, description: 'Vote registered successfully', type: VoteResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  async voteOnComment(
    @Param('commentId', ParseIntPipe) commentId: number,
    @Body() voteDto: VoteDto,
    @ReqUser() currentUser: User,
  ): Promise<VoteResponseDto | null> {
    return await this.voteService.voteComment(currentUser.id, commentId, voteDto);
  }

  @Get('comments/:commentId/votes')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get vote counts for a comment' })
  @ApiParam({ name: 'commentId', description: 'Comment ID', type: Number })
  @ApiResponse({ status: 200, description: 'Returns vote counts' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  async getCommentVoteCounts(
    @Param('commentId', ParseIntPipe) commentId: number,
  ): Promise<{ upvotes: number; downvotes: number }> {
    return this.voteService.getVoteCounts(VoteEntityType.COMMENT, commentId);
  }
}
