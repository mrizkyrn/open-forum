import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  UseInterceptors,
  UploadedFiles,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DiscussionSpaceService } from './discusison-space.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DiscussionSpaceResponseDto, PageableDiscussionSpaceResponseDto } from './dto/discussion-space-response.dto';
import { CreateDiscussionSpaceDto } from './dto/create-discussion-space.dto';
import { User } from '../user/entities/user.entity';
import { ReqUser } from 'src/common/decorators/user.decorator';
import { Pageable } from 'src/common/interfaces/pageable.interface';
import { UpdateDiscussionSpaceDto } from './dto/update-discussion-space.dto';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/common/enums/user-role.enum';
import { SearchDto } from 'src/common/dto/search.dto';

@ApiTags('Spaces')
@Controller('spaces')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class DiscussionSpaceController {
  constructor(private readonly spaceService: DiscussionSpaceService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles([UserRole.ADMIN])
  @ApiOperation({ summary: 'Create a new discussion space' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: 201,
    description: 'Space created successfully',
    type: DiscussionSpaceResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 409, description: 'Space with this slug already exists' })
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'icon', maxCount: 1 },
      { name: 'banner', maxCount: 1 },
    ]),
  )
  async create(
    @Body() createDto: CreateDiscussionSpaceDto,
    @ReqUser() currentUser: User,
    @UploadedFiles() files?: { icon?: Express.Multer.File[]; banner?: Express.Multer.File[] },
  ): Promise<DiscussionSpaceResponseDto> {
    return this.spaceService.create(createDto, currentUser, files);
  }

  @Get()
  @ApiOperation({ summary: 'Get all discussion spaces' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated list of spaces',
    type: PageableDiscussionSpaceResponseDto,
  })
  async findAll(
    @Query() searchDto: SearchDto,
    @ReqUser() currentUser?: User,
  ): Promise<Pageable<DiscussionSpaceResponseDto>> {
    return this.spaceService.findAll(searchDto, currentUser);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get a discussion space by slug' })
  @ApiParam({ name: 'slug', description: 'Space slug', example: 'web-development' })
  @ApiResponse({
    status: 200,
    description: 'Returns space details',
    type: DiscussionSpaceResponseDto,
  })
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
  @ApiResponse({ status: 404, description: 'Space not found' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @ReqUser() currentUser?: User,
  ): Promise<DiscussionSpaceResponseDto> {
    return this.spaceService.findById(id, currentUser);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles([UserRole.ADMIN])
  @ApiOperation({ summary: 'Update a discussion space' })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'id', description: 'Space ID', example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Space updated successfully',
    type: DiscussionSpaceResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not the creator of the space' })
  @ApiResponse({ status: 404, description: 'Space not found' })
  @ApiResponse({ status: 409, description: 'Space with this slug already exists' })
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'icon', maxCount: 1 },
      { name: 'banner', maxCount: 1 },
    ]),
  )
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateDiscussionSpaceDto,
    @ReqUser() currentUser: User,
    @UploadedFiles() files?: { icon?: Express.Multer.File[]; banner?: Express.Multer.File[] },
  ): Promise<DiscussionSpaceResponseDto> {
    return this.spaceService.update(id, updateDto, currentUser, files);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles([UserRole.ADMIN])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a discussion space' })
  @ApiParam({ name: 'id', description: 'Space ID', example: 1 })
  @ApiResponse({ status: 200, description: 'Space deleted successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Space has discussions' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not the creator of the space' })
  @ApiResponse({ status: 404, description: 'Space not found' })
  async delete(@Param('id', ParseIntPipe) id: number, @ReqUser() currentUser: User): Promise<void> {
    await this.spaceService.delete(id, currentUser);
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
}
