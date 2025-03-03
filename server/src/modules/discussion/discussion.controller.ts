import {
  Body,
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Query,
  Get,
  Delete,
  Put,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReqUser } from '../../common/decorators/user.decorator';
import { User } from '../user/entities/user.entity';
import { DiscussionService } from './discussion.service';
import { CreateDiscussionDto } from './dto/create-discussion.dto';
import { DiscussionResponseDto, PageableDiscussionResponseDto } from './dto/discussion-response.dto';
import { SearchDiscussionDto } from './dto/search-discussion.dto';
import { Pageable } from '../../common/interfaces/pageable.interface';
import { UpdateDiscussionDto } from './dto/update-discussion.dto';

@ApiTags('discussions')
@Controller('discussions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class DiscussionController {
  constructor(private readonly discussionService: DiscussionService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new discussion' })
  @ApiResponse({
    status: 201,
    description: 'Discussion created successfully',
    type: DiscussionResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseInterceptors(FilesInterceptor('files', 4))
  async createDiscussion(
    @Body() createDiscussionDto: CreateDiscussionDto,
    @ReqUser() currentUser: User,
    @UploadedFiles() files?: Express.Multer.File[],
  ): Promise<DiscussionResponseDto> {
    const discussion = await this.discussionService.create(createDiscussionDto, currentUser, files);

    return this.discussionService.formatDiscussionResponse(discussion, currentUser);
  }

  @Get()
  @ApiOperation({ summary: 'Get all discussions with pagination and filters' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated list of discussions',
    type: PageableDiscussionResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getAllDiscussions(
    @Query() searchDto: SearchDiscussionDto,
    @ReqUser() currentUser: User,
  ): Promise<Pageable<DiscussionResponseDto>> {
    return this.discussionService.findAll(searchDto, currentUser);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get discussion by ID' })
  @ApiParam({ name: 'id', description: 'Discussion ID', type: Number })
  @ApiResponse({ status: 200, description: 'Returns discussion details', type: DiscussionResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Discussion not found' })
  async getDiscussionById(
    @Param('id', ParseIntPipe) id: number,
    @ReqUser() currentUser: User,
  ): Promise<DiscussionResponseDto> {
    return this.discussionService.getDiscussionById(id, currentUser);
  }

  @Get('tags/popular')
  @ApiOperation({ summary: 'Get popular tags' })
  @ApiResponse({ status: 200, description: 'Returns list of popular tags' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getPopularTags(): Promise<{ tag: string; count: number }[]> {
    return this.discussionService.getPopularTags();
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update discussion' })
  @ApiParam({ name: 'id', description: 'Discussion ID', type: Number })
  @ApiResponse({ status: 200, description: 'Discussion updated successfully', type: DiscussionResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not the author of the discussion' })
  @ApiResponse({ status: 404, description: 'Discussion not found' })
  @UseInterceptors(FilesInterceptor('files', 4))
  async updateDiscussion(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDiscussionDto: UpdateDiscussionDto,
    @ReqUser() currentUser: User,
    @UploadedFiles() files?: Express.Multer.File[],
  ): Promise<DiscussionResponseDto> {
    return this.discussionService.update(id, updateDiscussionDto, currentUser, files);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete discussion' })
  @ApiParam({ name: 'id', description: 'Discussion ID', type: Number })
  @ApiResponse({ status: 200, description: 'Discussion deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not the author of the discussion' })
  @ApiResponse({ status: 404, description: 'Discussion not found' })
  async deleteDiscussion(@Param('id', ParseIntPipe) id: number, @ReqUser() currentUser: User): Promise<void> {
    await this.discussionService.delete(id, currentUser);
  }

  @Post(':id/bookmark')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bookmark a discussion' })
  @ApiParam({ name: 'id', description: 'Discussion ID', type: Number })
  @ApiResponse({ status: 200, description: 'Discussion bookmarked successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Discussion not found' })
  async bookmarkDiscussion(@Param('id', ParseIntPipe) id: number, @ReqUser() currentUser: User): Promise<void> {
    await this.discussionService.bookmarkDiscussion(id, currentUser.id);
  }

  @Get('bookmarked')
  @ApiOperation({ summary: 'Get user bookmarked discussions' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated list of bookmarked discussions',
    type: PageableDiscussionResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getBookmarkedDiscussions(
    @ReqUser() currentUser: User,
    @Query() searchDto: SearchDiscussionDto,
  ): Promise<Pageable<DiscussionResponseDto>> {
    return this.discussionService.getBookmarkedDiscussions(currentUser.id, searchDto);
  }

  @Delete(':id/bookmark')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove bookmark from a discussion' })
  @ApiParam({ name: 'id', description: 'Discussion ID', type: Number })
  @ApiResponse({ status: 200, description: 'Bookmark removed successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Discussion or bookmark not found' })
  async unbookmarkDiscussion(@Param('id', ParseIntPipe) id: number, @ReqUser() currentUser: User): Promise<void> {
    await this.discussionService.unbookmarkDiscussion(id, currentUser.id);
  }
}
