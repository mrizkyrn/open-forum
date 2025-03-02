import { Body, Controller, Post, UseGuards, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReqUser } from '../../common/decorators/user.decorator';
import { User } from '../user/entities/user.entity';
import { DiscussionService } from './discussion.service';
import { CreateDiscussionDto } from './dto/create-discussion.dto';
import { DiscussionResponseDto } from './dto/discussion-response.dto';
import { FilesInterceptor } from '@nestjs/platform-express';

@ApiTags('discussions')
@Controller('discussions')
export class DiscussionController {
  constructor(private readonly discussionService: DiscussionService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
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
}
