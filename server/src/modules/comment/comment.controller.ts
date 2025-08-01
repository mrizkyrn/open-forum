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
  Put,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ReqUser } from '../../common/decorators/user.decorator';
import { Pageable } from '../../common/interfaces/pageable.interface';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../user/entities/user.entity';
import { CommentService } from './comment.service';
import { CommentResponseDto, PageableCommentResponseDto } from './dto/comment-response.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { SearchCommentDto } from './dto/search-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@ApiTags('Comments')
@Controller()
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Post('discussions/:discussionId/comments')
  @ApiOperation({ summary: 'Create a new comment for a discussion' })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'discussionId', description: 'Discussion ID', type: Number })
  @ApiResponse({
    status: 201,
    description: 'Comment created successfully',
    type: CommentResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Discussion not found' })
  @UseInterceptors(FilesInterceptor('files', 2))
  async createComment(
    @Param('discussionId', ParseIntPipe) discussionId: number,
    @Body() createCommentDto: CreateCommentDto,
    @ReqUser() currentUser: User,
    @UploadedFiles() files?: Express.Multer.File[],
  ): Promise<CommentResponseDto> {
    return this.commentService.create(discussionId, createCommentDto, currentUser, files);
  }

  @Get('discussions/:discussionId/comments')
  @ApiOperation({ summary: 'Get all comments for a discussion with pagination' })
  @ApiParam({ name: 'discussionId', description: 'Discussion ID', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated list of comments',
    type: PageableCommentResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Discussion not found' })
  async getCommentsByDiscussionId(
    @Param('discussionId', ParseIntPipe) discussionId: number,
    @Query() searchDto: SearchCommentDto,
    @ReqUser() currentUser: User,
  ): Promise<Pageable<CommentResponseDto>> {
    return this.commentService.findByDiscussionId(discussionId, searchDto, currentUser);
  }

  @Get('comments/:commentId')
  @ApiOperation({ summary: 'Get a specific comment by ID' })
  @ApiParam({ name: 'discussionId', description: 'Discussion ID', type: Number })
  @ApiParam({ name: 'commentId', description: 'Comment ID', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Returns comment details',
    type: CommentResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  async getCommentById(
    @Param('commentId', ParseIntPipe) commentId: number,
    @ReqUser() currentUser: User,
  ): Promise<CommentResponseDto> {
    return await this.commentService.findById(commentId, currentUser);
  }

  @Get('comments/:commentId/replies')
  @ApiOperation({ summary: 'Get all replies for a specific comment' })
  @ApiParam({ name: 'commentId', description: 'Comment ID', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Returns list of replies',
    type: PageableCommentResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  async getRepliesByCommentId(
    @Param('commentId', ParseIntPipe) commentId: number,
    @Query() searchDto: SearchCommentDto,
    @ReqUser() currentUser: User,
  ): Promise<Pageable<CommentResponseDto>> {
    return this.commentService.findRepliesByParentId(commentId, searchDto, currentUser);
  }

  @Put('comments/:commentId')
  @ApiOperation({ summary: 'Update a comment' })
  @ApiParam({ name: 'commentId', description: 'Comment ID', type: Number })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: 200,
    description: 'Comment updated successfully',
    type: CommentResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not the author of the comment' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  @UseInterceptors(FilesInterceptor('files', 2))
  async updateComment(
    @Param('commentId', ParseIntPipe) commentId: number,
    @Body() updateCommentDto: UpdateCommentDto,
    @ReqUser() currentUser: User,
    @UploadedFiles() files?: Express.Multer.File[],
  ): Promise<CommentResponseDto> {
    return this.commentService.update(commentId, updateCommentDto, currentUser, files);
  }

  @Delete('comments/:commentId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a comment' })
  @ApiParam({ name: 'commentId', description: 'Comment ID', type: Number })
  @ApiResponse({ status: 200, description: 'Comment deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not the author of the comment' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  async deleteComment(
    @Param('commentId', ParseIntPipe) commentId: number,
    @ReqUser() currentUser: User,
  ): Promise<void> {
    return this.commentService.delete(commentId, currentUser);
  }
}
