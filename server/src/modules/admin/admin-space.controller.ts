import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { ReqUser } from '../../common/decorators/user.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DiscussionSpaceService } from '../discussion/discusison-space.service';
import { CreateDiscussionSpaceDto } from '../discussion/dto/create-discussion-space.dto';
import { DiscussionSpaceResponseDto } from '../discussion/dto/discussion-space-response.dto';
import { UpdateDiscussionSpaceDto } from '../discussion/dto/update-discussion-space.dto';
import { User } from '../user/entities/user.entity';

@ApiTags('Admin')
@Controller('admin/spaces')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminSpaceController {
  constructor(private readonly spaceService: DiscussionSpaceService) {}

  @Post()
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

  @Patch(':id')
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
}
