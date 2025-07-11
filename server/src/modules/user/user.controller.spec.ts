import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SortOrder } from '../../common/dto/search.dto';
import { UserRole } from '../../common/enums/user-role.enum';
import { Pageable } from '../../common/interfaces/pageable.interface';
import { SearchUserDto, UpdateUserDto, UserDetailResponseDto, UserResponseDto, UserSortBy } from './dto';
import { User } from './entities/user.entity';
import { UserController } from './user.controller';
import { UserService } from './user.service';

/**
 * Mock factory for creating User entities
 */
const createMockUser = (overrides: Partial<User> = {}): User => {
  const user = new User();
  user.id = 1;
  user.username = 'testuser';
  user.fullName = 'Test User';
  user.email = 'test@example.com';
  user.role = UserRole.USER;
  user.avatarUrl = null;
  user.lastActiveAt = new Date();
  user.createdAt = new Date();
  user.updatedAt = new Date();
  user.oauthProvider = null;

  return Object.assign(user, overrides);
};

/**
 * Mock factory for creating UserResponseDto
 */
const createMockUserResponseDto = (overrides: Partial<UserResponseDto> = {}): UserResponseDto => {
  const dto = new UserResponseDto();
  dto.id = 1;
  dto.username = 'testuser';
  dto.fullName = 'Test User';
  dto.role = UserRole.USER;
  dto.avatarUrl = null;
  dto.lastActiveAt = new Date();
  dto.createdAt = new Date();

  return Object.assign(dto, overrides);
};

/**
 * Mock factory for creating UserDetailResponseDto
 */
const createMockUserDetailResponseDto = (overrides: Partial<UserDetailResponseDto> = {}): UserDetailResponseDto => {
  const dto = new UserDetailResponseDto();
  dto.id = 1;
  dto.username = 'testuser';
  dto.fullName = 'Test User';
  dto.email = 'test@example.com';
  dto.role = UserRole.USER;
  dto.avatarUrl = null;
  dto.lastActiveAt = new Date();
  dto.createdAt = new Date();
  dto.updatedAt = new Date();

  return Object.assign(dto, overrides);
};

describe('UserController', () => {
  let controller: UserController;
  let userService: jest.Mocked<UserService>;

  // Test data
  let mockUser: User;
  let mockUserResponse: UserResponseDto;
  let mockUserDetailResponse: UserDetailResponseDto;
  let mockSearchDto: SearchUserDto;
  let mockUpdateDto: UpdateUserDto;
  let mockFile: Express.Multer.File;

  beforeEach(async () => {
    // Create mock UserService
    const mockUserService = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByUsername: jest.fn(),
      update: jest.fn(),
      updateAvatar: jest.fn(),
      removeAvatar: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    userService = module.get(UserService);

    // Setup test data
    mockUser = createMockUser();
    mockUserResponse = createMockUserResponseDto();
    mockUserDetailResponse = createMockUserDetailResponseDto();

    mockSearchDto = {
      page: 1,
      limit: 10,
      search: '',
      sortBy: UserSortBy.CREATED_AT,
      sortOrder: SortOrder.DESC,
    };

    mockUpdateDto = {
      fullName: 'Updated Name',
      username: 'updateduser',
    };

    mockFile = {
      fieldname: 'avatar',
      originalname: 'test-avatar.jpg',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      buffer: Buffer.from('fake-image-data'),
      size: 1024,
    } as Express.Multer.File;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Controller Initialization', () => {
    it('should be defined', () => {
      expect(controller).toBeDefined();
    });
  });

  // ==================== USER LISTING & SEARCH ====================

  describe('getAllUsers', () => {
    it('should return paginated list of users', async () => {
      const mockPaginatedResponse: Pageable<UserResponseDto> = {
        items: [mockUserResponse],
        meta: {
          totalItems: 1,
          itemsPerPage: 10,
          currentPage: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };

      userService.findAll.mockResolvedValue(mockPaginatedResponse);

      const result = await controller.getAllUsers(mockSearchDto, mockUser);

      expect(result).toEqual(mockPaginatedResponse);
      expect(userService.findAll).toHaveBeenCalledWith(mockSearchDto, mockUser);
    });

    it('should pass search parameters correctly', async () => {
      const searchWithFilters: SearchUserDto = {
        ...mockSearchDto,
        search: 'john',
        role: UserRole.ADMIN,
      };

      const mockPaginatedResponse: Pageable<UserResponseDto> = {
        items: [],
        meta: {
          totalItems: 0,
          itemsPerPage: 10,
          currentPage: 1,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };

      userService.findAll.mockResolvedValue(mockPaginatedResponse);

      await controller.getAllUsers(searchWithFilters, mockUser);

      expect(userService.findAll).toHaveBeenCalledWith(searchWithFilters, mockUser);
    });
  });

  // ==================== CURRENT USER OPERATIONS ====================

  describe('getCurrentUser', () => {
    it('should return current user details', async () => {
      userService.findById.mockResolvedValue(mockUserDetailResponse);

      const result = await controller.getCurrentUser(mockUser);

      expect(result).toEqual(mockUserDetailResponse);
      expect(userService.findById).toHaveBeenCalledWith(mockUser.id);
    });
  });

  describe('updateCurrentUser', () => {
    it('should update current user profile successfully', async () => {
      userService.update.mockResolvedValue(mockUserResponse);

      const result = await controller.updateCurrentUser(mockUpdateDto, mockUser);

      expect(result).toEqual(mockUserResponse);
      expect(userService.update).toHaveBeenCalledWith(mockUser.id, mockUpdateDto);
    });

    it('should handle validation errors', async () => {
      const invalidUpdateDto = { username: '' } as UpdateUserDto;
      userService.update.mockRejectedValue(new BadRequestException('Invalid username'));

      await expect(controller.updateCurrentUser(invalidUpdateDto, mockUser)).rejects.toThrow(BadRequestException);
    });
  });

  describe('uploadCurrentUserAvatar', () => {
    it('should upload avatar successfully', async () => {
      const updatedUserResponse = createMockUserResponseDto({
        avatarUrl: 'https://example.com/avatar.jpg',
      });

      userService.updateAvatar.mockResolvedValue(updatedUserResponse);

      const result = await controller.uploadCurrentUserAvatar(mockFile, mockUser);

      expect(result).toEqual(updatedUserResponse);
      expect(userService.updateAvatar).toHaveBeenCalledWith(mockUser.id, mockFile);
    });

    it('should throw BadRequestException if no file is provided', async () => {
      await expect(controller.uploadCurrentUserAvatar(null as any, mockUser)).rejects.toThrow(BadRequestException);

      expect(userService.updateAvatar).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if file is undefined', async () => {
      await expect(controller.uploadCurrentUserAvatar(undefined as any, mockUser)).rejects.toThrow(BadRequestException);

      expect(userService.updateAvatar).not.toHaveBeenCalled();
    });

    it('should handle service errors during avatar upload', async () => {
      userService.updateAvatar.mockRejectedValue(new BadRequestException('Upload failed'));

      await expect(controller.uploadCurrentUserAvatar(mockFile, mockUser)).rejects.toThrow(BadRequestException);

      expect(userService.updateAvatar).toHaveBeenCalledWith(mockUser.id, mockFile);
    });
  });

  describe('removeCurrentUserAvatar', () => {
    it('should remove avatar successfully', async () => {
      const updatedUserResponse = createMockUserResponseDto({
        avatarUrl: null,
      });

      userService.removeAvatar.mockResolvedValue(updatedUserResponse);

      const result = await controller.removeCurrentUserAvatar(mockUser);

      expect(result).toEqual(updatedUserResponse);
      expect(userService.removeAvatar).toHaveBeenCalledWith(mockUser.id);
    });

    it('should handle service errors during avatar removal', async () => {
      userService.removeAvatar.mockRejectedValue(new BadRequestException('Removal failed'));

      await expect(controller.removeCurrentUserAvatar(mockUser)).rejects.toThrow(BadRequestException);

      expect(userService.removeAvatar).toHaveBeenCalledWith(mockUser.id);
    });
  });

  // ==================== PUBLIC USER INFORMATION ====================

  describe('getUserById', () => {
    it('should return user details by ID', async () => {
      const userId = 123;
      userService.findById.mockResolvedValue(mockUserDetailResponse);

      const result = await controller.getUserById(userId);

      expect(result).toEqual(mockUserDetailResponse);
      expect(userService.findById).toHaveBeenCalledWith(userId);
    });

    it('should handle non-existent user ID', async () => {
      const userId = 999;
      userService.findById.mockRejectedValue(new BadRequestException('User not found'));

      await expect(controller.getUserById(userId)).rejects.toThrow(BadRequestException);

      expect(userService.findById).toHaveBeenCalledWith(userId);
    });
  });

  describe('getUserByUsername', () => {
    it('should return user details by username', async () => {
      const username = 'john_doe123';
      userService.findByUsername.mockResolvedValue(mockUserDetailResponse);

      const result = await controller.getUserByUsername(username);

      expect(result).toEqual(mockUserDetailResponse);
      expect(userService.findByUsername).toHaveBeenCalledWith(username);
    });

    it('should handle non-existent username', async () => {
      const username = 'nonexistent';
      userService.findByUsername.mockRejectedValue(new BadRequestException('User not found'));

      await expect(controller.getUserByUsername(username)).rejects.toThrow(BadRequestException);

      expect(userService.findByUsername).toHaveBeenCalledWith(username);
    });

    it('should handle usernames with special characters', async () => {
      const username = 'user_with-special.chars';
      userService.findByUsername.mockResolvedValue(mockUserDetailResponse);

      await controller.getUserByUsername(username);

      expect(userService.findByUsername).toHaveBeenCalledWith(username);
    });
  });

  // ==================== ERROR HANDLING TESTS ====================

  describe('Error Handling', () => {
    it('should propagate service errors correctly in getAllUsers', async () => {
      const serviceError = new Error('Service unavailable');
      userService.findAll.mockRejectedValue(serviceError);

      await expect(controller.getAllUsers(mockSearchDto, mockUser)).rejects.toThrow(serviceError);
    });

    it('should propagate service errors correctly in getCurrentUser', async () => {
      const serviceError = new Error('Database connection failed');
      userService.findById.mockRejectedValue(serviceError);

      await expect(controller.getCurrentUser(mockUser)).rejects.toThrow(serviceError);
    });

    it('should propagate service errors correctly in updateCurrentUser', async () => {
      const serviceError = new Error('Update failed');
      userService.update.mockRejectedValue(serviceError);

      await expect(controller.updateCurrentUser(mockUpdateDto, mockUser)).rejects.toThrow(serviceError);
    });
  });

  // ==================== INTEGRATION TESTS ====================

  describe('Integration Tests', () => {
    it('should handle complete user profile update workflow', async () => {
      // Step 1: Get current user
      userService.findById.mockResolvedValue(mockUserDetailResponse);
      const currentUser = await controller.getCurrentUser(mockUser);
      expect(currentUser).toEqual(mockUserDetailResponse);

      // Step 2: Update profile
      const updatedResponse = createMockUserResponseDto({
        fullName: 'Updated Name',
        username: 'updateduser',
      });
      userService.update.mockResolvedValue(updatedResponse);
      const updateResult = await controller.updateCurrentUser(mockUpdateDto, mockUser);
      expect(updateResult).toEqual(updatedResponse);

      // Step 3: Upload avatar
      const avatarResponse = createMockUserResponseDto({
        avatarUrl: 'https://example.com/new-avatar.jpg',
      });
      userService.updateAvatar.mockResolvedValue(avatarResponse);
      const avatarResult = await controller.uploadCurrentUserAvatar(mockFile, mockUser);
      expect(avatarResult).toEqual(avatarResponse);
    });

    it('should handle user search and retrieval workflow', async () => {
      // Step 1: Search users
      const searchResults: Pageable<UserResponseDto> = {
        items: [mockUserResponse],
        meta: {
          totalItems: 1,
          itemsPerPage: 10,
          currentPage: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };
      userService.findAll.mockResolvedValue(searchResults);
      const searchResult = await controller.getAllUsers(mockSearchDto, mockUser);
      expect(searchResult).toEqual(searchResults);

      // Step 2: Get specific user by ID
      userService.findById.mockResolvedValue(mockUserDetailResponse);
      const userById = await controller.getUserById(mockUser.id);
      expect(userById).toEqual(mockUserDetailResponse);

      // Step 3: Get specific user by username
      userService.findByUsername.mockResolvedValue(mockUserDetailResponse);
      const userByUsername = await controller.getUserByUsername(mockUser.username);
      expect(userByUsername).toEqual(mockUserDetailResponse);
    });
  });

  // ==================== EDGE CASES ====================

  describe('Edge Cases', () => {
    it('should handle empty search results', async () => {
      const emptyResults: Pageable<UserResponseDto> = {
        items: [],
        meta: {
          totalItems: 0,
          itemsPerPage: 10,
          currentPage: 1,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };

      userService.findAll.mockResolvedValue(emptyResults);

      const result = await controller.getAllUsers(mockSearchDto, mockUser);

      expect(result).toEqual(emptyResults);
      expect(result.items).toHaveLength(0);
    });

    it('should handle large file uploads within limits', async () => {
      const largeFile = {
        ...mockFile,
        size: 4 * 1024 * 1024, // 4MB - within 5MB limit
      };

      const updatedResponse = createMockUserResponseDto({
        avatarUrl: 'https://example.com/large-avatar.jpg',
      });

      userService.updateAvatar.mockResolvedValue(updatedResponse);

      const result = await controller.uploadCurrentUserAvatar(largeFile, mockUser);

      expect(result).toEqual(updatedResponse);
      expect(userService.updateAvatar).toHaveBeenCalledWith(mockUser.id, largeFile);
    });

    it('should handle numeric usernames in string format', async () => {
      const numericUsername = '12345';
      userService.findByUsername.mockResolvedValue(mockUserDetailResponse);

      await controller.getUserByUsername(numericUsername);

      expect(userService.findByUsername).toHaveBeenCalledWith(numericUsername);
    });

    it('should handle empty update data', async () => {
      const emptyUpdateDto = {} as UpdateUserDto;
      userService.update.mockResolvedValue(mockUserResponse);

      const result = await controller.updateCurrentUser(emptyUpdateDto, mockUser);

      expect(result).toEqual(mockUserResponse);
      expect(userService.update).toHaveBeenCalledWith(mockUser.id, emptyUpdateDto);
    });
  });

  // ==================== SECURITY TESTS ====================

  describe('Security Tests', () => {
    it('should ensure user can only update their own profile', async () => {
      // The controller gets currentUser from JWT token/guard, so this is inherently secure
      userService.update.mockResolvedValue(mockUserResponse);

      await controller.updateCurrentUser(mockUpdateDto, mockUser);

      // Verify that the service is called with the current user's ID
      expect(userService.update).toHaveBeenCalledWith(mockUser.id, mockUpdateDto);
    });

    it('should ensure user can only upload avatar for themselves', async () => {
      userService.updateAvatar.mockResolvedValue(mockUserResponse);

      await controller.uploadCurrentUserAvatar(mockFile, mockUser);

      // Verify that the service is called with the current user's ID
      expect(userService.updateAvatar).toHaveBeenCalledWith(mockUser.id, mockFile);
    });

    it('should ensure user can only remove their own avatar', async () => {
      userService.removeAvatar.mockResolvedValue(mockUserResponse);

      await controller.removeCurrentUserAvatar(mockUser);

      // Verify that the service is called with the current user's ID
      expect(userService.removeAvatar).toHaveBeenCalledWith(mockUser.id);
    });
  });
});
