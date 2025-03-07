import {
  Controller,
  Post,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
  Body,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReqUser } from '../../common/decorators/user.decorator';
import { User } from '../user/entities/user.entity';
import { VoteService } from './vote.service';
import { VoteEntityType, VoteValue } from './entities/vote.entity';
import { VoteDto } from './dto/vote-dto';
import { VoteCountsDto, VoteResponseDto } from './dto/vote-response.dto';

@ApiTags('Votes')
@Controller()
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class VoteController {
  constructor(private readonly voteService: VoteService) {}

  // DISCUSSION VOTE ENDPOINTS
  @Post('discussions/:id/votes')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Vote on a discussion' })
  @ApiParam({ name: 'id', description: 'Discussion ID', type: Number })
  @ApiBody({ type: VoteDto })
  @ApiResponse({ status: 200, description: 'Vote registered successfully', type: VoteResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Discussion not found' })
  async voteOnDiscussion(
    @Param('id', ParseIntPipe) id: number,
    @Body() voteDto: VoteDto,
    @ReqUser() currentUser: User,
  ): Promise<VoteResponseDto | null> {
    return await this.voteService.voteDiscussion(currentUser.id, id, voteDto.value);
  }

  @Get('discussions/:id/votes')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get vote counts for a discussion' })
  @ApiParam({ name: 'id', description: 'Discussion ID', type: Number })
  @ApiResponse({ status: 200, description: 'Returns vote counts' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Discussion not found' })
  async getDiscussionVoteCounts(@Param('id', ParseIntPipe) id: number): Promise<VoteCountsDto> {
    return this.voteService.getVoteCounts(VoteEntityType.DISCUSSION, id);
  }

  @Get('discussions/:id/votes/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check if the current user has voted on a discussion' })
  @ApiParam({ name: 'id', description: 'Discussion ID', type: Number })
  @ApiResponse({ status: 200, description: 'Returns vote status for the current user' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUserDiscussionVote(
    @Param('id', ParseIntPipe) id: number,
    @ReqUser() currentUser: User,
  ): Promise<number | null> {
    return await this.voteService.getUserVoteStatus(currentUser.id, VoteEntityType.DISCUSSION, id);
  }

  // COMMENT VOTE ENDPOINTS
  @Post('comments/:id/votes')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Vote on a comment' })
  @ApiParam({ name: 'id', description: 'Comment ID', type: Number })
  @ApiBody({ type: VoteDto })
  @ApiResponse({ status: 200, description: 'Vote registered successfully', type: VoteResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  async voteOnComment(
    @Param('id', ParseIntPipe) id: number,
    @Body() voteDto: VoteDto,
    @ReqUser() currentUser: User,
  ): Promise<VoteResponseDto | null> {
    return await this.voteService.voteComment(currentUser.id, id, voteDto.value);
  }

  @Get('comments/:id/votes')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get vote counts for a comment' })
  @ApiParam({ name: 'id', description: 'Comment ID', type: Number })
  @ApiResponse({ status: 200, description: 'Returns vote counts' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  async getCommentVoteCounts(@Param('id', ParseIntPipe) id: number): Promise<{ upvotes: number; downvotes: number }> {
    return this.voteService.getVoteCounts(VoteEntityType.COMMENT, id);
  }

  @Get('comments/:id/votes/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check if the current user has voted on a comment' })
  @ApiParam({ name: 'id', description: 'Comment ID', type: Number })
  @ApiResponse({ status: 200, description: 'Returns vote status for the current user' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUserCommentVote(
    @Param('id', ParseIntPipe) id: number,
    @ReqUser() currentUser: User,
  ): Promise<number | null> {
    return await this.voteService.getUserVoteStatus(currentUser.id, VoteEntityType.COMMENT, id);
  }

  // ADVANCED VOTE STATISTICS ENDPOINTS
  @Get('users/:id/voted-discussions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get discussions a user has voted on' })
  @ApiParam({ name: 'id', description: 'User ID', type: Number })
  @ApiResponse({ status: 200, description: 'Returns list of discussion IDs' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getDiscussionsVotedByUser(
    @Param('id', ParseIntPipe) userId: number,
    @Query('voteValue') voteValue?: VoteValue,
  ): Promise<number[]> {
    return this.voteService.getEntitiesVotedByUser(userId, VoteEntityType.DISCUSSION, voteValue);
  }

  @Get('users/:id/voted-comments')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get comments a user has voted on' })
  @ApiParam({ name: 'id', description: 'User ID', type: Number })
  @ApiResponse({ status: 200, description: 'Returns list of comment IDs' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCommentsVotedByUser(
    @Param('id', ParseIntPipe) userId: number,
    @Query('voteValue') voteValue?: VoteValue,
  ): Promise<number[]> {
    return this.voteService.getEntitiesVotedByUser(userId, VoteEntityType.COMMENT, voteValue);
  }

  @Get('user/voted-discussions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get discussions the current user has voted on' })
  @ApiResponse({ status: 200, description: 'Returns list of discussion IDs' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCurrentUserVotedDiscussions(
    @ReqUser() currentUser: User,
    @Query('voteValue') voteValue?: VoteValue,
  ): Promise<number[]> {
    return this.voteService.getEntitiesVotedByUser(currentUser.id, VoteEntityType.DISCUSSION, voteValue);
  }

  @Get('user/voted-comments')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get comments the current user has voted on' })
  @ApiResponse({ status: 200, description: 'Returns list of comment IDs' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCurrentUserVotedComments(
    @ReqUser() currentUser: User,
    @Query('voteValue') voteValue?: VoteValue,
  ): Promise<number[]> {
    return this.voteService.getEntitiesVotedByUser(currentUser.id, VoteEntityType.COMMENT, voteValue);
  }
}
