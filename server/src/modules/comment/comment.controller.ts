import {
  Body,
  Controller,
  Post,
  Param,
  UseInterceptors,
  UploadedFiles,
  ParseIntPipe,
  UseGuards,
  Get,
  Query,
  NotFoundException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { CommentService } from './comment.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CommentResponseDto, PageableCommentResponseDto } from './dto/comment-response.dto';
import { User } from '../user/entities/user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReqUser } from '../../common/decorators/user.decorator';
import { SearchCommentDto } from './dto/search-comment.dto';
import { Pageable } from 'src/common/interfaces/pageable.interface';

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
  ): Promise<Pageable<CommentResponseDto>> {
    return this.commentService.findByDiscussionId(discussionId, searchDto);
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
  async getCommentById(@Param('commentId', ParseIntPipe) commentId: number): Promise<CommentResponseDto> {
    const comment = await this.commentService.findById(commentId);

    return comment;
  }
}
