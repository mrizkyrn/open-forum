import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserService } from './user.service';
import { User } from './entities/user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReqUser } from '../../common/decorators/user.decorator';
import { Pageable } from '../../common/interfaces/pageable.interface';
import { PageableUserResponseDto, UserResponseDto } from './dto/user-response.dto';
import { SearchUserDto } from './dto/search-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiBearerAuth()
@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @ApiOperation({ summary: 'Get all users with pagination' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated list of users',
    type: PageableUserResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getAllUsers(@Query() searchDto: SearchUserDto): Promise<Pageable<UserResponseDto>> {
    return this.userService.findAll(searchDto);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Returns current user profile', type: UserResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCurrentUser(@ReqUser() currentUser: User): Promise<UserResponseDto> {
    return await this.userService.findById(currentUser.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', description: 'User ID', type: Number })
  @ApiResponse({ status: 200, description: 'Returns user details', type: UserResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserById(@Param('id', ParseIntPipe) id: number): Promise<UserResponseDto> {
    return await this.userService.findById(id);
  }

  @Put('me')
  @ApiOperation({ summary: 'Update current user' })
  @ApiParam({ name: 'id', description: 'User ID', type: Number })
  @ApiResponse({ status: 200, description: 'User updated successfully', type: UserResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateCurrentUser(
    @ReqUser() currentUser: User,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return await this.userService.update(currentUser.id, updateUserDto);
  }

  @Post('me/avatar')
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiOperation({ summary: 'Upload avatar for current user' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: 'Avatar updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async uploadCurrentUserAvatar(
    @UploadedFile() file: Express.Multer.File,
    @ReqUser() currentUser: User,
  ): Promise<UserResponseDto> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    return await this.userService.updateAvatar(currentUser.id, file);
  }

  @Delete('me/avatar')
  @ApiOperation({ summary: 'Remove avatar for current user' })
  @ApiResponse({ status: 200, description: 'Avatar removed successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async removeCurrentUserAvatar(@ReqUser() currentUser: User): Promise<UserResponseDto> {
    return await this.userService.removeAvatar(currentUser.id);
  }
}
