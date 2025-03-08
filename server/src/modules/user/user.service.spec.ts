import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { UserService } from './user.service';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UserRole } from '../../common/enums/user-role.enum';

// Mock bcrypt
jest.mock('bcrypt');

describe('UserService', () => {
  let userService: UserService;
  let userRepository: Repository<User>;

  const mockUserRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    userService = module.get<UserService>(UserService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));

    // Reset mocks
    jest.clearAllMocks();

    // Default bcrypt mock implementation
    (bcrypt.hash as jest.Mock).mockImplementation(() => Promise.resolve('hashed_password'));
    (bcrypt.compare as jest.Mock).mockImplementation(() => Promise.resolve(true));
  });

  describe('create', () => {
    it('should successfully create a user', async () => {
      // Arrange
      const createUserDto: CreateUserDto = {
        username: '2110511091',
        password: 'StrongP@ssw0rd',
        fullName: 'Test User',
        role: UserRole.STUDENT,
      };

      const expectedUser = {
        id: 1,
        username: '2110511091',
        password: 'hashed_password',
        fullName: 'Test User',
        role: UserRole.STUDENT,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Set up our mocks
      mockUserRepository.findOne.mockResolvedValue(null); // No existing user
      mockUserRepository.create.mockReturnValue(expectedUser);
      mockUserRepository.save.mockResolvedValue(expectedUser);

      // Act
      const result = await userService.create(createUserDto);

      // Assert
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { username: '2110511091' },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith('StrongP@ssw0rd', 10);
      expect(mockUserRepository.create).toHaveBeenCalledWith({
        username: '2110511091',
        password: 'hashed_password',
        fullName: 'Test User',
        role: UserRole.STUDENT,
      });
      expect(mockUserRepository.save).toHaveBeenCalledWith(expectedUser);
      expect(result).toEqual(expectedUser);
    });

    it('should throw ConflictException if username already exists', async () => {
      // Arrange
      const createUserDto: CreateUserDto = {
        username: '2110511091',
        password: 'StrongP@ssw0rd',
        fullName: 'Test User',
        role: UserRole.STUDENT,
      };

      const existingUser = {
        id: 1,
        username: '2110511091',
        password: 'hashed_password',
      };

      // Set up our mock to return an existing user
      mockUserRepository.findOne.mockResolvedValue(existingUser);

      // Act & Assert
      await expect(userService.create(createUserDto)).rejects.toThrow(ConflictException);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { username: '2110511091' },
      });
      expect(mockUserRepository.create).not.toHaveBeenCalled();
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('findByUsername', () => {
    it('should return a user if found', async () => {
      // Arrange
      const expectedUser = {
        id: 1,
        username: '2110511091',
      };
      mockUserRepository.findOne.mockResolvedValue(expectedUser);

      // Act
      const result = await userService.findByUsername('2110511091');

      // Assert
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { username: '2110511091' },
      });
      expect(result).toEqual(expectedUser);
    });

    it('should return null if user not found', async () => {
      // Arrange
      mockUserRepository.findOne.mockResolvedValue(null);

      // Act
      const result = await userService.findByUsername('nonexistent');

      // Assert
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { username: 'nonexistent' },
      });
      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should return a user if found', async () => {
      // Arrange
      const expectedUser = {
        id: 1,
        username: '2110511091',
      };
      mockUserRepository.findOne.mockResolvedValue(expectedUser);

      // Act
      const result = await userService.findById(1);

      // Assert
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result).toEqual(expectedUser);
    });

    it('should return null if user not found', async () => {
      // Arrange
      mockUserRepository.findOne.mockResolvedValue(null);

      // Act
      const result = await userService.findById(999);

      // Assert
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: 999 },
      });
      expect(result).toBeNull();
    });
  });

  describe('verifyPassword', () => {
    it('should return true when password matches', async () => {
      // Arrange
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      // Act
      const result = await userService.verifyPassword('password123', 'hashed_password');

      // Assert
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashed_password');
      expect(result).toBe(true);
    });

    it('should return false when password does not match', async () => {
      // Arrange
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      // Act
      const result = await userService.verifyPassword('wrong_password', 'hashed_password');

      // Assert
      expect(bcrypt.compare).toHaveBeenCalledWith('wrong_password', 'hashed_password');
      expect(result).toBe(false);
    });
  });
});
