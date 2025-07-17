import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository, SelectQueryBuilder } from 'typeorm';

import { UserRole } from '../../common/enums/user-role.enum';
import { FileService } from '../../core/file/file.service';
import { CreateUserDto, SearchUserDto, UpdateUserDto } from './dto';
import { User } from './entities/user.entity';
import { UserService } from './user.service';

// Mock bcrypt
jest.mock('bcrypt');
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('UserService', () => {
  let service: UserService;
  let userRepository: jest.Mocked<Repository<User>>;
  let fileService: jest.Mocked<FileService>;
  let queryBuilder: jest.Mocked<SelectQueryBuilder<User>>;

  // Mock data factory
  const createMockUser = (overrides: Partial<User> = {}): User => {
    const baseUser = {
      id: 1,
      username: 'testuser',
      fullName: 'Test User',
      email: 'test@example.com',
      password: 'hashedPassword',
      role: UserRole.USER,
      avatarUrl: 'https://example.com/avatar.jpg',
      lastActiveAt: new Date(),
      oauthProvider: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: undefined,
      normalizeDataBeforeInsert: jest.fn(),
      normalizeDataBeforeUpdate: jest.fn(),
      isAdmin: jest.fn().mockReturnValue(false),
      isRecentlyActive: jest.fn().mockReturnValue(true),
      updateLastActive: jest.fn(),
      deactivate: jest.fn(),
      activate: jest.fn(),
      ...overrides,
    };
    return baseUser as unknown as User;
  };

  const mockUser = createMockUser();
  const mockAdmin = createMockUser({
    id: 2,
    username: 'admin',
    role: UserRole.ADMIN,
    isAdmin: jest.fn().mockReturnValue(true),
  });

  beforeEach(async () => {
    // Create mock query builder
    queryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
      getMany: jest.fn(),
      getManyAndCount: jest.fn(),
      getCount: jest.fn(),
      getRawMany: jest.fn(),
    } as any;

    // Create mock repository
    const mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    };

    // Create mock file service
    const mockFileService = {
      uploadUserAvatar: jest.fn(),
      deleteFile: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
        {
          provide: FileService,
          useValue: mockFileService,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    userRepository = module.get(getRepositoryToken(User));
    fileService = module.get(FileService);

    // Setup bcrypt mocks
    mockBcrypt.hash.mockResolvedValue('hashedPassword');
    mockBcrypt.compare.mockResolvedValue(true);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Core CRUD Operations', () => {
    describe('create', () => {
      const createUserDto: CreateUserDto = {
        username: 'newuser',
        fullName: 'New User',
        email: 'new@example.com',
        password: 'password123',
        role: UserRole.USER,
      };

      it('should create a new user successfully', async () => {
        userRepository.findOne.mockResolvedValue(null); // No existing user
        userRepository.create.mockReturnValue(mockUser);
        userRepository.save.mockResolvedValue(mockUser);

        const result = await service.create(createUserDto);

        expect(userRepository.findOne).toHaveBeenCalledTimes(2); // Check username and email
        expect(mockBcrypt.hash).toHaveBeenCalledWith('password123', 12);
        expect(userRepository.create).toHaveBeenCalledWith({
          username: 'newuser',
          password: 'hashedPassword',
          fullName: 'New User',
          email: 'new@example.com',
          role: UserRole.USER,
        });
        expect(userRepository.save).toHaveBeenCalledWith(mockUser);
        expect(result).toEqual(mockUser);
      });

      it('should throw ConflictException if username already exists', async () => {
        userRepository.findOne.mockResolvedValueOnce(mockUser); // Username exists

        await expect(service.create(createUserDto)).rejects.toThrow(ConflictException);
        expect(userRepository.findOne).toHaveBeenCalledWith({
          where: { username: 'newuser' },
        });
        // Should not proceed to create or save user
        expect(userRepository.create).not.toHaveBeenCalled();
        expect(userRepository.save).not.toHaveBeenCalled();
      });

      it('should throw ConflictException if email already exists', async () => {
        userRepository.findOne
          .mockResolvedValueOnce(null) // Username doesn't exist
          .mockResolvedValueOnce(mockUser); // Email exists

        await expect(service.create(createUserDto)).rejects.toThrow(ConflictException);
        expect(userRepository.findOne).toHaveBeenCalledWith({
          where: { email: 'new@example.com' },
        });
        // Should not proceed to create or save user
        expect(userRepository.create).not.toHaveBeenCalled();
        expect(userRepository.save).not.toHaveBeenCalled();
      });

      it('should create user without email', async () => {
        const createUserDtoNoEmail = { ...createUserDto, email: undefined };
        userRepository.findOne.mockResolvedValue(null);
        userRepository.create.mockReturnValue(mockUser);
        userRepository.save.mockResolvedValue(mockUser);

        await service.create(createUserDtoNoEmail);

        expect(userRepository.findOne).toHaveBeenCalledTimes(1); // Only check username
        expect(userRepository.create).toHaveBeenCalledWith({
          username: 'newuser',
          password: 'hashedPassword',
          fullName: 'New User',
          email: null,
          role: UserRole.USER,
        });
      });
    });

    describe('findAll', () => {
      const searchDto: SearchUserDto = {
        page: 1,
        limit: 10,
        search: 'test',
        role: UserRole.USER,
        sortBy: 'createdAt' as any,
        sortOrder: 'DESC' as any,
      };

      it('should return paginated users', async () => {
        const users = [mockUser];
        const totalItems = 1;
        queryBuilder.getManyAndCount.mockResolvedValue([users, totalItems]);

        const result = await service.findAll(searchDto, mockUser);

        expect(userRepository.createQueryBuilder).toHaveBeenCalledWith('user');
        expect(result).toEqual({
          items: expect.any(Array),
          meta: {
            totalItems: 1,
            itemsPerPage: 10,
            currentPage: 1,
            totalPages: 1,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        });
      });

      it('should filter admin users for non-admin users', async () => {
        queryBuilder.getManyAndCount.mockResolvedValue([[mockUser], 1]);

        await service.findAll(searchDto, mockUser);

        expect(queryBuilder.andWhere).toHaveBeenCalledWith('user.role != :adminRole', {
          adminRole: UserRole.ADMIN,
        });
        expect(queryBuilder.andWhere).toHaveBeenCalledWith('user.id != :currentUserId', {
          currentUserId: mockUser.id,
        });
      });

      it('should allow admin users to see all users', async () => {
        queryBuilder.getManyAndCount.mockResolvedValue([[mockUser], 1]);

        await service.findAll(searchDto, mockAdmin);

        expect(queryBuilder.andWhere).not.toHaveBeenCalledWith('user.role != :adminRole', {
          adminRole: UserRole.ADMIN,
        });
      });
    });

    describe('findById', () => {
      it('should return user details by ID', async () => {
        userRepository.findOne.mockResolvedValue(mockUser);

        const result = await service.findById(1);

        expect(userRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
        expect(result).toBeDefined();
      });

      it('should throw NotFoundException if user not found', async () => {
        userRepository.findOne.mockResolvedValue(null);

        await expect(service.findById(999)).rejects.toThrow(NotFoundException);
      });
    });

    describe('findByUsername', () => {
      it('should return user details by username', async () => {
        userRepository.findOne.mockResolvedValue(mockUser);

        const result = await service.findByUsername('testuser');

        expect(userRepository.findOne).toHaveBeenCalledWith({
          where: { username: 'testuser' },
        });
        expect(result).toBeDefined();
      });

      it('should throw NotFoundException if user not found', async () => {
        userRepository.findOne.mockResolvedValue(null);

        await expect(service.findByUsername('nonexistent')).rejects.toThrow(NotFoundException);
      });

      it('should normalize username before search', async () => {
        userRepository.findOne.mockResolvedValue(mockUser);

        await service.findByUsername('TestUser');

        expect(userRepository.findOne).toHaveBeenCalledWith({
          where: { username: 'testuser' },
        });
      });
    });

    describe('findManyByUsernames', () => {
      it('should return users by usernames array', async () => {
        const usernames = ['user1', 'user2'];
        queryBuilder.getMany.mockResolvedValue([mockUser]);

        const result = await service.findManyByUsernames(usernames);

        expect(queryBuilder.where).toHaveBeenCalledWith('user.username IN (:...usernames)', {
          usernames: ['user1', 'user2'],
        });
        expect(result).toEqual([mockUser]);
      });

      it('should return empty array for empty usernames', async () => {
        const result = await service.findManyByUsernames([]);

        expect(result).toEqual([]);
        expect(userRepository.createQueryBuilder).not.toHaveBeenCalled();
      });
    });

    describe('update', () => {
      const updateUserDto: UpdateUserDto = {
        fullName: 'Updated Name',
        username: 'updateduser',
      };

      beforeEach(() => {
        // Reset query builder mocks for update tests
        userRepository.createQueryBuilder.mockReturnValue(queryBuilder);
        queryBuilder.where.mockReturnThis();
        queryBuilder.andWhere.mockReturnThis();
      });

      it('should update user successfully', async () => {
        userRepository.findOne.mockResolvedValue(mockUser);
        queryBuilder.getOne.mockResolvedValue(null); // No username conflict
        userRepository.save.mockResolvedValue(createMockUser({ ...updateUserDto }));

        const result = await service.update(1, updateUserDto);

        expect(userRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
        expect(userRepository.save).toHaveBeenCalled();
        expect(result).toBeDefined();
      });

      it('should throw ConflictException if username already exists', async () => {
        jest.clearAllMocks();

        // Mock the user retrieval - existing user to update
        const currentUser = createMockUser({ id: 1, username: 'currentuser' });
        userRepository.findOne.mockResolvedValue(currentUser);

        // Mock createQueryBuilder chain to return an existing user with the same username (conflict)
        const conflictUser = createMockUser({
          id: 2, // Different ID to simulate another user has this username
          username: 'updateduser',
        });

        // Set up the complete query builder chain
        userRepository.createQueryBuilder.mockReturnValue(queryBuilder);
        queryBuilder.where.mockReturnValue(queryBuilder);
        queryBuilder.andWhere.mockReturnValue(queryBuilder);
        queryBuilder.getOne.mockResolvedValue(conflictUser);

        // Test data with username change (different from current user's username)
        const updateWithUsernameDto = { fullName: 'Updated Name', username: 'updateduser' };

        await expect(service.update(1, updateWithUsernameDto)).rejects.toThrow(ConflictException);

        // Verify the right calls were made before exception
        expect(userRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
        expect(userRepository.createQueryBuilder).toHaveBeenCalledWith('user');
        expect(queryBuilder.where).toHaveBeenCalledWith('user.username = :username', { username: 'updateduser' });
        expect(queryBuilder.andWhere).toHaveBeenCalledWith('user.id != :excludeUserId', { excludeUserId: 1 });
        expect(queryBuilder.getOne).toHaveBeenCalled();
        expect(userRepository.save).not.toHaveBeenCalled();
      });

      it('should hash password if provided', async () => {
        const updateWithPassword = { ...updateUserDto, password: 'newpassword' };
        userRepository.findOne.mockResolvedValue(mockUser);
        queryBuilder.getOne.mockResolvedValue(null);
        userRepository.save.mockResolvedValue(mockUser);

        await service.update(1, updateWithPassword);

        expect(mockBcrypt.hash).toHaveBeenCalledWith('newpassword', 12);
      });
    });

    describe('delete', () => {
      it('should delete user successfully', async () => {
        userRepository.findOne.mockResolvedValue(mockUser);
        fileService.deleteFile.mockResolvedValue(undefined);

        await service.delete(1, 2); // Different user IDs

        expect(userRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
        expect(userRepository.remove).toHaveBeenCalledWith(mockUser);
      });

      it('should throw BadRequestException if trying to delete own account', async () => {
        await expect(service.delete(1, 1)).rejects.toThrow(BadRequestException);
      });

      it('should cleanup avatar during deletion', async () => {
        userRepository.findOne.mockResolvedValue(mockUser);
        fileService.deleteFile.mockResolvedValue(undefined);

        await service.delete(1, 2);

        expect(fileService.deleteFile).toHaveBeenCalledWith(mockUser.avatarUrl);
      });
    });
  });

  describe('Avatar Management', () => {
    const mockFile = {
      originalname: 'avatar.jpg',
      buffer: Buffer.from('test'),
    } as Express.Multer.File;

    describe('updateAvatar', () => {
      it('should update avatar successfully', async () => {
        userRepository.findOne.mockResolvedValue(mockUser);
        fileService.uploadUserAvatar.mockResolvedValue('https://example.com/new-avatar.jpg');
        userRepository.save.mockResolvedValue(
          createMockUser({
            avatarUrl: 'https://example.com/new-avatar.jpg',
          }),
        );

        const result = await service.updateAvatar(1, mockFile);

        expect(fileService.deleteFile).toHaveBeenCalledWith('https://example.com/avatar.jpg');
        expect(fileService.uploadUserAvatar).toHaveBeenCalledWith(mockFile);
        expect(userRepository.save).toHaveBeenCalled();
        expect(result).toBeDefined();
      });

      it('should throw BadRequestException if upload fails', async () => {
        userRepository.findOne.mockResolvedValue(mockUser);
        fileService.uploadUserAvatar.mockRejectedValue(new Error('Upload failed'));

        await expect(service.updateAvatar(1, mockFile)).rejects.toThrow(BadRequestException);
      });
    });

    describe('removeAvatar', () => {
      it('should remove avatar successfully', async () => {
        const userWithAvatar = createMockUser({ avatarUrl: 'https://example.com/avatar.jpg' });
        userRepository.findOne.mockResolvedValue(userWithAvatar);
        fileService.deleteFile.mockResolvedValue(undefined);
        userRepository.save.mockResolvedValue(createMockUser({ avatarUrl: null }));

        const result = await service.removeAvatar(1);

        expect(fileService.deleteFile).toHaveBeenCalledWith('https://example.com/avatar.jpg');
        expect(userRepository.save).toHaveBeenCalled();
        expect(result).toBeDefined();
      });

      it('should handle case when user has no avatar', async () => {
        const userWithoutAvatar = createMockUser({ avatarUrl: null });
        userRepository.findOne.mockResolvedValue(userWithoutAvatar);
        userRepository.save.mockResolvedValue(userWithoutAvatar);

        const result = await service.removeAvatar(1);

        expect(fileService.deleteFile).not.toHaveBeenCalled();
        expect(result).toBeDefined();
      });
    });
  });

  describe('Authentication & Authorization', () => {
    describe('getUserWithCredentials', () => {
      it('should return user with password', async () => {
        queryBuilder.getOne.mockResolvedValue(mockUser);

        const result = await service.getUserWithCredentials('testuser');

        expect(queryBuilder.addSelect).toHaveBeenCalledWith('user.password');
        expect(queryBuilder.where).toHaveBeenCalledWith('user.username = :username', {
          username: 'testuser',
        });
        expect(result).toEqual(mockUser);
      });

      it('should return null if user not found', async () => {
        queryBuilder.getOne.mockResolvedValue(null);

        const result = await service.getUserWithCredentials('nonexistent');

        expect(result).toBeNull();
      });
    });

    describe('verifyPassword', () => {
      it('should return true for correct password', async () => {
        mockBcrypt.compare.mockResolvedValue(true);

        const result = await service.verifyPassword('password', 'hashedPassword');

        expect(mockBcrypt.compare).toHaveBeenCalledWith('password', 'hashedPassword');
        expect(result).toBe(true);
      });

      it('should return false for incorrect password', async () => {
        mockBcrypt.compare.mockResolvedValue(false);

        const result = await service.verifyPassword('wrongpassword', 'hashedPassword');

        expect(result).toBe(false);
      });
    });

    describe('isUsernameExists', () => {
      it('should return true if username exists', async () => {
        userRepository.findOne.mockResolvedValue(mockUser);

        const result = await service.isUsernameExists('testuser');

        expect(result).toBe(true);
      });

      it('should return false if username does not exist', async () => {
        userRepository.findOne.mockResolvedValue(null);

        const result = await service.isUsernameExists('nonexistent');

        expect(result).toBe(false);
      });
    });

    describe('findUserByEmail', () => {
      it('should return user by email', async () => {
        userRepository.findOne.mockResolvedValue(mockUser);

        const result = await service.findUserByEmail('test@example.com');

        expect(userRepository.findOne).toHaveBeenCalledWith({
          where: { email: 'test@example.com' },
        });
        expect(result).toEqual(mockUser);
      });

      it('should return null if user not found', async () => {
        userRepository.findOne.mockResolvedValue(null);

        const result = await service.findUserByEmail('nonexistent@example.com');

        expect(result).toBeNull();
      });
    });

    describe('createOAuthUser', () => {
      const oauthData = {
        email: 'oauth@example.com',
        fullName: 'OAuth User',
        avatarUrl: 'https://example.com/oauth-avatar.jpg',
        provider: 'google',
        role: UserRole.USER,
        username: 'oauthuser',
      };

      it('should create OAuth user successfully', async () => {
        userRepository.create.mockReturnValue(mockUser);
        userRepository.save.mockResolvedValue(mockUser);

        const result = await service.createOAuthUser(oauthData);

        expect(userRepository.create).toHaveBeenCalledWith({
          username: 'oauthuser',
          fullName: 'OAuth User',
          email: 'oauth@example.com',
          avatarUrl: 'https://example.com/oauth-avatar.jpg',
          oauthProvider: 'google',
          role: UserRole.USER,
        });
        expect(result).toEqual(mockUser);
      });
    });
  });

  describe('Activity Tracking', () => {
    describe('updateLastActive', () => {
      it('should update last active timestamp', async () => {
        userRepository.update.mockResolvedValue({ affected: 1, raw: {}, generatedMaps: [] });

        await service.updateLastActive(1);

        expect(userRepository.update).toHaveBeenCalledWith(1, {
          lastActiveAt: expect.any(Date),
        });
      });

      it('should throttle updates within interval', async () => {
        // First call
        await service.updateLastActive(1);

        // Second call immediately (should be throttled)
        await service.updateLastActive(1);

        expect(userRepository.update).toHaveBeenCalledTimes(1);
      });

      it('should handle update errors gracefully', async () => {
        userRepository.update.mockRejectedValue(new Error('Database error'));

        // Should not throw
        await expect(service.updateLastActive(1)).resolves.toBeUndefined();
      });
    });
  });

  describe('Analytics & Reporting', () => {
    describe('getTotalUserCount', () => {
      it('should return total user count', async () => {
        userRepository.count.mockResolvedValue(100);

        const result = await service.getTotalUserCount();

        expect(userRepository.count).toHaveBeenCalled();
        expect(result).toBe(100);
      });
    });

    describe('getUserCountByDateRange', () => {
      it('should return user count for date range', async () => {
        const startDate = new Date('2023-01-01');
        const endDate = new Date('2023-12-31');
        userRepository.count.mockResolvedValue(50);

        const result = await service.getUserCountByDateRange(startDate, endDate);

        expect(userRepository.count).toHaveBeenCalledWith({
          where: {
            createdAt: expect.any(Object), // Between clause
          },
        });
        expect(result).toBe(50);
      });
    });

    describe('getActiveUserCount', () => {
      it('should return active user count', async () => {
        const since = new Date('2023-01-01');
        queryBuilder.getCount.mockResolvedValue(25);

        const result = await service.getActiveUserCount(since);

        expect(queryBuilder.where).toHaveBeenCalledWith('user.lastActiveAt >= :since', { since });
        expect(result).toBe(25);
      });
    });

    describe('getTimeSeries', () => {
      it('should return time series data', async () => {
        const startDate = new Date('2023-01-01');
        const endDate = new Date('2023-12-31');
        const mockTimeSeries = [
          { date: '2023-01-01', count: '5' },
          { date: '2023-01-02', count: '3' },
        ];
        queryBuilder.getRawMany.mockResolvedValue(mockTimeSeries);

        const result = await service.getTimeSeries(startDate, endDate);

        expect(queryBuilder.where).toHaveBeenCalledWith('user.createdAt BETWEEN :startDate AND :endDate', {
          startDate,
          endDate,
        });
        expect(result).toEqual(mockTimeSeries);
      });
    });
  });

  describe('Utility Methods', () => {
    describe('getUserEntity', () => {
      it('should return user with relations', async () => {
        const relations = ['posts', 'comments'];
        userRepository.findOne.mockResolvedValue(mockUser);

        const result = await service.getUserEntity(1, relations);

        expect(userRepository.findOne).toHaveBeenCalledWith({
          where: { id: 1 },
          relations,
        });
        expect(result).toEqual(mockUser);
      });

      it('should throw NotFoundException if user not found', async () => {
        userRepository.findOne.mockResolvedValue(null);

        await expect(service.getUserEntity(999)).rejects.toThrow(NotFoundException);
      });
    });

    describe('updateUser', () => {
      it('should update user with partial data', async () => {
        const updateData = { fullName: 'Updated Name' };
        userRepository.update.mockResolvedValue({ affected: 1, raw: {}, generatedMaps: [] });
        const updatedUser = createMockUser({ ...updateData });
        userRepository.findOne.mockResolvedValue(updatedUser);

        const result = await service.updateUser(1, updateData);

        expect(userRepository.update).toHaveBeenCalledWith(1, updateData);
        expect(result).toEqual(updatedUser);
      });
    });
  });

  describe('Private Helper Methods', () => {
    describe('normalizeUsername', () => {
      it('should normalize username to lowercase and trim', () => {
        // Access private method for testing
        const normalizeUsername = (service as any).normalizeUsername.bind(service);

        expect(normalizeUsername('  TestUser  ')).toBe('testuser');
      });

      it('should throw BadRequestException for username too long', () => {
        const normalizeUsername = (service as any).normalizeUsername.bind(service);
        const longUsername = 'a'.repeat(26);

        expect(() => normalizeUsername(longUsername)).toThrow(BadRequestException);
      });
    });

    describe('normalizeEmail', () => {
      it('should normalize email to lowercase and trim', () => {
        const normalizeEmail = (service as any).normalizeEmail.bind(service);

        expect(normalizeEmail('  Test@Example.COM  ')).toBe('test@example.com');
      });

      it('should throw BadRequestException for email too long', () => {
        const normalizeEmail = (service as any).normalizeEmail.bind(service);
        const longEmail = 'a'.repeat(90) + '@example.com';

        expect(() => normalizeEmail(longEmail)).toThrow(BadRequestException);
      });
    });
  });
});
