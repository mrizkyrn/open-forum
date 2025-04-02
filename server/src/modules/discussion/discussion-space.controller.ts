import { Controller, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ReqUser } from '../../common/decorators/user.decorator';
import { Pageable } from '../../common/interfaces/pageable.interface';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../user/entities/user.entity';
import { DiscussionSpaceService } from './discusison-space.service';
import { DiscussionSpaceResponseDto, PageableDiscussionSpaceResponseDto } from './dto/discussion-space-response.dto';
import { SearchSpaceDto } from './dto/search-space.dto';

@ApiTags('Spaces')
@Controller('spaces')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class DiscussionSpaceController {
  constructor(private readonly spaceService: DiscussionSpaceService) {}

  @Get()
  @ApiOperation({ summary: 'Get all discussion spaces' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated list of spaces',
    type: PageableDiscussionSpaceResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(
    @Query() searchDto: SearchSpaceDto,
    @ReqUser() currentUser?: User,
  ): Promise<Pageable<DiscussionSpaceResponseDto>> {
    return this.spaceService.findAll(searchDto, currentUser);
  }

  @Get('popular')
  @ApiOperation({ summary: 'Get popular discussion spaces' })
  @ApiResponse({
    status: 200,
    description: 'Returns list of popular spaces',
    type: [DiscussionSpaceResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getPopularSpaces(
    @Query('limit', ParseIntPipe) limit: number = 10,
    @ReqUser() currentUser?: User,
  ): Promise<DiscussionSpaceResponseDto[]> {
    return this.spaceService.getPopularSpaces(limit, currentUser);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get a discussion space by slug' })
  @ApiParam({ name: 'slug', description: 'Space slug', example: 'web-development' })
  @ApiResponse({
    status: 200,
    description: 'Returns space details',
    type: DiscussionSpaceResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Space not found' })
  async findBySlug(@Param('slug') slug: string, @ReqUser() currentUser?: User): Promise<DiscussionSpaceResponseDto> {
    return this.spaceService.findBySlug(slug, currentUser);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a discussion space by ID' })
  @ApiParam({ name: 'id', description: 'Space ID', example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Returns space details',
    type: DiscussionSpaceResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Space not found' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @ReqUser() currentUser?: User,
  ): Promise<DiscussionSpaceResponseDto> {
    return this.spaceService.findById(id, currentUser);
  }

  @Get(':id/is-following')
  @ApiOperation({ summary: 'Check if user is following a space' })
  @ApiParam({ name: 'id', description: 'Space ID', example: 1 })
  @ApiResponse({ status: 200, description: 'Returns following status' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Space not found' })
  async isFollowing(
    @Param('id', ParseIntPipe) id: number,
    @ReqUser() currentUser: User,
  ): Promise<{ isFollowing: boolean }> {
    return { isFollowing: await this.spaceService.isFollowing(id, currentUser.id) };
  }

  @Post(':id/follow')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Follow a discussion space' })
  @ApiParam({ name: 'id', description: 'Space ID', example: 1 })
  @ApiResponse({ status: 200, description: 'Successfully followed the space' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Space not found' })
  async follow(@Param('id', ParseIntPipe) id: number, @ReqUser() currentUser: User): Promise<void> {
    await this.spaceService.followSpace(id, currentUser.id);
  }

  @Post(':id/unfollow')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unfollow a discussion space' })
  @ApiParam({ name: 'id', description: 'Space ID', example: 1 })
  @ApiResponse({ status: 200, description: 'Successfully unfollowed the space' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Space not found' })
  async unfollow(@Param('id', ParseIntPipe) id: number, @ReqUser() currentUser: User): Promise<void> {
    await this.spaceService.unfollowSpace(id, currentUser.id);
  }
}
