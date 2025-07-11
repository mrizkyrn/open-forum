import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  ValidationPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ReqUser } from '../../common/decorators/user.decorator';
import { Pageable } from '../../common/interfaces/pageable.interface';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PageableUserResponseDto, SearchUserDto, UpdateUserDto, UserDetailResponseDto, UserResponseDto } from './dto';
import { User } from './entities/user.entity';
import { UserService } from './user.service';

/**
 * User Controller
 *
 * Handles all user-related HTTP requests including:
 * - User CRUD operations
 * - Profile management
 * - Avatar management
 * - User search and listing
 */
@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserController {
  constructor(private readonly userService: UserService) {}

  // ==================== USER LISTING & SEARCH ====================

  @Get()
  @ApiOperation({
    summary: 'Get all users with pagination and filtering',
    description: 'Retrieve a paginated list of users with optional search and filtering capabilities',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully retrieved paginated list of users',
    type: PageableUserResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication required',
  })
  async getAllUsers(
    @Query(new ValidationPipe({ transform: true, whitelist: true }))
    searchDto: SearchUserDto,
    @ReqUser() currentUser: User,
  ): Promise<Pageable<UserResponseDto>> {
    return this.userService.findAll(searchDto, currentUser);
  }

  // ==================== CURRENT USER OPERATIONS ====================

  @Get('me')
  @ApiOperation({
    summary: 'Get current user profile',
    description: 'Retrieve detailed information about the currently authenticated user',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully retrieved current user profile',
    type: UserDetailResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication required',
  })
  async getCurrentUser(@ReqUser() currentUser: User): Promise<UserDetailResponseDto> {
    return this.userService.findById(currentUser.id);
  }

  @Patch('me')
  @ApiOperation({
    summary: 'Update current user profile',
    description: 'Update profile information for the currently authenticated user',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Profile updated successfully',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication required',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Username or email already exists',
  })
  async updateCurrentUser(
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    updateUserDto: UpdateUserDto,
    @ReqUser() currentUser: User,
  ): Promise<UserResponseDto> {
    return this.userService.update(currentUser.id, updateUserDto);
  }

  @Post('me/avatar')
  @UseInterceptors(
    FileInterceptor('avatar', {
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
      },
      fileFilter: (req, file, callback) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
          return callback(new BadRequestException('Only image files are allowed'), false);
        }
        callback(null, true);
      },
    }),
  )
  @ApiOperation({
    summary: 'Upload avatar for current user',
    description: 'Upload a new avatar image for the currently authenticated user',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Avatar image file',
    schema: {
      type: 'object',
      properties: {
        avatar: {
          type: 'string',
          format: 'binary',
          description: 'Avatar image file (jpg, jpeg, png, gif, webp) - max 5MB',
        },
      },
      required: ['avatar'],
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Avatar uploaded successfully',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid file format or size',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication required',
  })
  @HttpCode(HttpStatus.OK)
  async uploadCurrentUserAvatar(
    @UploadedFile() file: Express.Multer.File,
    @ReqUser() currentUser: User,
  ): Promise<UserResponseDto> {
    if (!file) {
      throw new BadRequestException('Avatar file is required');
    }

    return this.userService.updateAvatar(currentUser.id, file);
  }

  @Delete('me/avatar')
  @ApiOperation({
    summary: 'Remove avatar for current user',
    description: 'Remove the current avatar image for the authenticated user',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Avatar removed successfully',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication required',
  })
  @HttpCode(HttpStatus.OK)
  async removeCurrentUserAvatar(@ReqUser() currentUser: User): Promise<UserResponseDto> {
    return this.userService.removeAvatar(currentUser.id);
  }

  // ==================== PUBLIC USER INFORMATION ====================

  @Get(':id')
  @ApiOperation({
    summary: 'Get user by ID',
    description: 'Retrieve public information about a specific user by their ID',
  })
  @ApiParam({
    name: 'id',
    description: 'User ID',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully retrieved user details',
    type: UserDetailResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication required',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
  })
  async getUserById(@Param('id', ParseIntPipe) id: number): Promise<UserDetailResponseDto> {
    return this.userService.findById(id);
  }

  @Get('username/:username')
  @ApiOperation({
    summary: 'Get user by username',
    description: 'Retrieve public information about a specific user by their username',
  })
  @ApiParam({
    name: 'username',
    description: 'Username',
    type: String,
    example: 'john_doe123',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully retrieved user details',
    type: UserDetailResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication required',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
  })
  async getUserByUsername(@Param('username') username: string): Promise<UserDetailResponseDto> {
    return this.userService.findByUsername(username);
  }
}
