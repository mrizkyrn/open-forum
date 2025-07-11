import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';

import { UserRole } from '../../common/enums/user-role.enum';
import { jwtConfig } from '../../config';
import { User } from '../user/entities/user.entity';
import { UserService } from '../user/user.service';
import { AuthService } from './auth.service';
import { ChangePasswordDto, LoginDto, RegisterDto } from './dto';

describe('AuthService', () => {
  let service: AuthService;
  let userService: jest.Mocked<UserService>;
  let jwtService: jest.Mocked<JwtService>;
  let jwtConfigService: ConfigType<typeof jwtConfig>;

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

  const mockJwtConfig = {
    accessTokenSecret: 'access-secret',
    refreshTokenSecret: 'refresh-secret',
    accessTokenExpires: '1h',
    refreshTokenExpires: '7d',
  };

  beforeEach(async () => {
    // Create mock services
    const mockUserService = {
      create: jest.fn(),
      getUserWithCredentials: jest.fn(),
      verifyPassword: jest.fn(),
      updateLastActive: jest.fn(),
      getUserEntity: jest.fn(),
      update: jest.fn(),
      findUserByEmail: jest.fn(),
      createOAuthUser: jest.fn(),
      updateUser: jest.fn(),
      isUsernameExists: jest.fn(),
    };

    const mockJwtService = {
      signAsync: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: jwtConfig.KEY,
          useValue: mockJwtConfig,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userService = module.get(UserService);
    jwtService = module.get(JwtService);
    jwtConfigService = module.get(jwtConfig.KEY);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication Operations', () => {
    describe('register', () => {
      const registerDto: RegisterDto = {
        username: 'newuser',
        fullName: 'New User',
        email: 'new@example.com',
        password: 'password123',
      };

      it('should register a new user successfully', async () => {
        userService.create.mockResolvedValue(mockUser);

        const result = await service.register(registerDto);

        expect(userService.create).toHaveBeenCalledWith({
          username: 'newuser',
          password: 'password123',
          fullName: 'New User',
          email: 'new@example.com',
          role: UserRole.USER,
        });
        expect(result).toEqual({
          message: 'Registration successful! You can now log in.',
        });
      });

      it('should register user without email', async () => {
        const registerDtoNoEmail = { ...registerDto, email: null };
        userService.create.mockResolvedValue(mockUser);

        await service.register(registerDtoNoEmail);

        expect(userService.create).toHaveBeenCalledWith({
          username: 'newuser',
          password: 'password123',
          fullName: 'New User',
          email: undefined,
          role: UserRole.USER,
        });
      });

      it('should throw error if user creation fails', async () => {
        userService.create.mockRejectedValue(new Error('Creation failed'));

        await expect(service.register(registerDto)).rejects.toThrow('Creation failed');
      });
    });

    describe('login', () => {
      const loginDto: LoginDto = {
        username: 'testuser',
        password: 'password123',
      };

      beforeEach(() => {
        jwtService.signAsync.mockResolvedValueOnce('access-token').mockResolvedValueOnce('refresh-token');
      });

      it('should login user successfully', async () => {
        userService.getUserWithCredentials.mockResolvedValue(mockUser);
        userService.verifyPassword.mockResolvedValue(true);
        userService.updateLastActive.mockResolvedValue(undefined);

        const result = await service.login(loginDto);

        expect(userService.getUserWithCredentials).toHaveBeenCalledWith('testuser');
        expect(userService.verifyPassword).toHaveBeenCalledWith('password123', 'hashedPassword');
        expect(userService.updateLastActive).toHaveBeenCalledWith(1);
        expect(result).toMatchObject({
          user: expect.any(Object),
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
          expiresIn: 3600,
          tokenType: 'Bearer',
        });
      });

      it('should throw UnauthorizedException if user not found', async () => {
        userService.getUserWithCredentials.mockResolvedValue(null);

        await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
        expect(userService.verifyPassword).not.toHaveBeenCalled();
      });

      it('should throw UnauthorizedException if user has no password', async () => {
        const userWithoutPassword = { ...mockUser, password: null };
        userService.getUserWithCredentials.mockResolvedValue(userWithoutPassword as any);

        await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
        expect(userService.verifyPassword).not.toHaveBeenCalled();
      });

      it('should throw UnauthorizedException if password is invalid', async () => {
        userService.getUserWithCredentials.mockResolvedValue(mockUser);
        userService.verifyPassword.mockResolvedValue(false);

        await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      });
    });

    describe('oauthLogin', () => {
      beforeEach(() => {
        jwtService.signAsync.mockResolvedValueOnce('access-token').mockResolvedValueOnce('refresh-token');
      });

      it('should handle OAuth login successfully', async () => {
        userService.updateLastActive.mockResolvedValue(undefined);

        const result = await service.oauthLogin(mockUser);

        expect(userService.updateLastActive).toHaveBeenCalledWith(1);
        expect(result).toMatchObject({
          user: expect.any(Object),
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
          expiresIn: 3600,
          tokenType: 'Bearer',
        });
      });

      it('should handle OAuth login errors', async () => {
        userService.updateLastActive.mockRejectedValue(new Error('Update failed'));

        await expect(service.oauthLogin(mockUser)).rejects.toThrow('Update failed');
      });
    });

    describe('logout', () => {
      it('should logout user successfully', async () => {
        const result = await service.logout(1);

        expect(result).toMatchObject({
          message: 'Successfully logged out',
          loggedOutAt: expect.any(Date),
        });
      });
    });
  });

  describe('Token Management', () => {
    describe('refreshToken', () => {
      beforeEach(() => {
        jwtService.signAsync.mockResolvedValueOnce('new-access-token').mockResolvedValueOnce('new-refresh-token');
      });

      it('should refresh tokens successfully', async () => {
        userService.getUserEntity.mockResolvedValue(mockUser);
        userService.updateLastActive.mockResolvedValue(undefined);

        const result = await service.refreshToken(1);

        expect(userService.getUserEntity).toHaveBeenCalledWith(1);
        expect(userService.updateLastActive).toHaveBeenCalledWith(1);
        expect(result).toEqual({
          accessToken: 'new-access-token',
          expiresIn: 3600,
          tokenType: 'Bearer',
          issuedAt: expect.any(Date),
          refreshToken: 'new-refresh-token',
        });
      });

      it('should throw UnauthorizedException if user not found', async () => {
        userService.getUserEntity.mockRejectedValue(new Error('User not found'));

        await expect(service.refreshToken(999)).rejects.toThrow(UnauthorizedException);
      });
    });

    describe('generateAuthTokens', () => {
      it('should generate tokens with correct payload', async () => {
        jwtService.signAsync.mockResolvedValueOnce('access-token').mockResolvedValueOnce('refresh-token');

        // Access private method for testing
        const generateAuthTokens = (service as any).generateAuthTokens.bind(service);
        const result = await generateAuthTokens(mockUser);

        expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
        expect(jwtService.signAsync).toHaveBeenCalledWith(
          {
            sub: 1,
            username: 'testuser',
            role: UserRole.USER,
          },
          {
            secret: 'access-secret',
            expiresIn: '1h',
          },
        );
        expect(jwtService.signAsync).toHaveBeenCalledWith(
          {
            sub: 1,
            username: 'testuser',
            role: UserRole.USER,
          },
          {
            secret: 'refresh-secret',
            expiresIn: '7d',
          },
        );
        expect(result).toEqual({
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
        });
      });

      it('should throw BadRequestException if token generation fails', async () => {
        jwtService.signAsync.mockRejectedValue(new Error('JWT signing failed'));

        const generateAuthTokens = (service as any).generateAuthTokens.bind(service);

        await expect(generateAuthTokens(mockUser)).rejects.toThrow(BadRequestException);
      });
    });
  });

  describe('Password Management', () => {
    describe('changePassword', () => {
      const changePasswordDto: ChangePasswordDto = {
        currentPassword: 'oldpassword',
        newPassword: 'newpassword123',
      };

      it('should change password successfully', async () => {
        userService.getUserEntity.mockResolvedValue(mockUser);
        userService.getUserWithCredentials.mockResolvedValue(mockUser);
        userService.verifyPassword.mockResolvedValue(true);
        userService.update.mockResolvedValue(expect.any(Object));

        const result = await service.changePassword(1, changePasswordDto);

        expect(userService.getUserEntity).toHaveBeenCalledWith(1);
        expect(userService.getUserWithCredentials).toHaveBeenCalledWith('testuser');
        expect(userService.verifyPassword).toHaveBeenCalledWith('oldpassword', 'hashedPassword');
        expect(userService.update).toHaveBeenCalledWith(1, {
          password: 'newpassword123',
        });
        expect(result).toEqual({
          message: 'Password changed successfully',
        });
      });

      it('should throw UnauthorizedException if current password is incorrect', async () => {
        userService.getUserEntity.mockResolvedValue(mockUser);
        userService.getUserWithCredentials.mockResolvedValue(mockUser);
        userService.verifyPassword.mockResolvedValue(false);

        await expect(service.changePassword(1, changePasswordDto)).rejects.toThrow(UnauthorizedException);
        expect(userService.update).not.toHaveBeenCalled();
      });

      it('should throw UnauthorizedException if user has no password', async () => {
        userService.getUserEntity.mockResolvedValue(mockUser);
        userService.getUserWithCredentials.mockResolvedValue({ ...mockUser, password: null } as any);

        await expect(service.changePassword(1, changePasswordDto)).rejects.toThrow(UnauthorizedException);
      });
    });
  });

  describe('OAuth Operations', () => {
    describe('validateOAuthUser', () => {
      const oauthProfile = {
        email: 'oauth@example.com',
        firstName: 'OAuth',
        lastName: 'User',
        avatarUrl: 'https://example.com/oauth-avatar.jpg',
      };

      it('should return existing user if found', async () => {
        userService.findUserByEmail.mockResolvedValue(mockUser);
        userService.updateUser.mockResolvedValue(mockUser);

        const result = await service.validateOAuthUser(oauthProfile, 'google');

        expect(userService.findUserByEmail).toHaveBeenCalledWith('oauth@example.com');
        expect(result).toEqual(mockUser);
      });

      it('should update existing user avatar if they dont have one', async () => {
        const userWithoutAvatar = { ...mockUser, avatarUrl: null };
        userService.findUserByEmail.mockResolvedValue(userWithoutAvatar as any);
        userService.updateUser.mockResolvedValue(userWithoutAvatar as any);

        await service.validateOAuthUser(oauthProfile, 'google');

        expect(userService.updateUser).toHaveBeenCalledWith(1, {
          avatarUrl: 'https://example.com/oauth-avatar.jpg',
        });
      });

      it('should create new user if not found', async () => {
        userService.findUserByEmail.mockResolvedValue(null);
        userService.isUsernameExists.mockResolvedValue(false);
        userService.createOAuthUser.mockResolvedValue(mockUser);

        const result = await service.validateOAuthUser(oauthProfile, 'google');

        expect(userService.createOAuthUser).toHaveBeenCalledWith({
          email: 'oauth@example.com',
          fullName: 'OAuth User',
          avatarUrl: 'https://example.com/oauth-avatar.jpg',
          provider: 'google',
          role: UserRole.USER,
          username: expect.any(String),
        });
        expect(result).toEqual(mockUser);
      });

      it('should handle profile with only first name', async () => {
        const profileWithFirstNameOnly = {
          email: 'oauth@example.com',
          firstName: 'OAuth',
          lastName: '',
          avatarUrl: undefined,
        };

        userService.findUserByEmail.mockResolvedValue(null);
        userService.isUsernameExists.mockResolvedValue(false);
        userService.createOAuthUser.mockResolvedValue(mockUser);

        await service.validateOAuthUser(profileWithFirstNameOnly, 'google');

        expect(userService.createOAuthUser).toHaveBeenCalledWith({
          email: 'oauth@example.com',
          fullName: 'OAuth',
          avatarUrl: undefined,
          provider: 'google',
          role: UserRole.USER,
          username: expect.any(String),
        });
      });

      it('should use email prefix as fallback for name', async () => {
        const profileWithoutName = {
          email: 'oauth@example.com',
          firstName: '',
          lastName: '',
          avatarUrl: undefined,
        };

        userService.findUserByEmail.mockResolvedValue(null);
        userService.isUsernameExists.mockResolvedValue(false);
        userService.createOAuthUser.mockResolvedValue(mockUser);

        await service.validateOAuthUser(profileWithoutName, 'google');

        expect(userService.createOAuthUser).toHaveBeenCalledWith({
          email: 'oauth@example.com',
          fullName: 'oauth',
          avatarUrl: undefined,
          provider: 'google',
          role: UserRole.USER,
          username: expect.any(String),
        });
      });
    });
  });

  describe('Private Helper Methods', () => {
    describe('parseExpirationTime', () => {
      it('should parse seconds correctly', () => {
        const parseExpirationTime = (service as any).parseExpirationTime.bind(service);

        expect(parseExpirationTime('30s')).toBe(30);
      });

      it('should parse minutes correctly', () => {
        const parseExpirationTime = (service as any).parseExpirationTime.bind(service);

        expect(parseExpirationTime('15m')).toBe(900);
      });

      it('should parse hours correctly', () => {
        const parseExpirationTime = (service as any).parseExpirationTime.bind(service);

        expect(parseExpirationTime('2h')).toBe(7200);
      });

      it('should parse days correctly', () => {
        const parseExpirationTime = (service as any).parseExpirationTime.bind(service);

        expect(parseExpirationTime('7d')).toBe(604800);
      });

      it('should default to 1 hour for unknown units', () => {
        const parseExpirationTime = (service as any).parseExpirationTime.bind(service);

        expect(parseExpirationTime('5x')).toBe(3600);
      });
    });

    describe('buildFullName', () => {
      it('should combine first and last name', () => {
        const buildFullName = (service as any).buildFullName.bind(service);

        expect(buildFullName('John', 'Doe', 'john@example.com')).toBe('John Doe');
      });

      it('should use only first name if last name is empty', () => {
        const buildFullName = (service as any).buildFullName.bind(service);

        expect(buildFullName('John', '', 'john@example.com')).toBe('John');
      });

      it('should use email prefix if no names provided', () => {
        const buildFullName = (service as any).buildFullName.bind(service);

        expect(buildFullName('', '', 'john@example.com')).toBe('john');
      });
    });

    describe('generateUniqueUsername', () => {
      it('should generate username from first and last name', async () => {
        userService.isUsernameExists.mockResolvedValue(false);

        const generateUniqueUsername = (service as any).generateUniqueUsername.bind(service);
        const result = await generateUniqueUsername('John', 'Doe', 'john@example.com');

        expect(result).toBe('johndoe');
      });

      it('should generate username from first name only', async () => {
        userService.isUsernameExists.mockResolvedValue(false);

        const generateUniqueUsername = (service as any).generateUniqueUsername.bind(service);
        const result = await generateUniqueUsername('John', '', 'john@example.com');

        expect(result).toBe('john');
      });

      it('should use email prefix as fallback', async () => {
        userService.isUsernameExists.mockResolvedValue(false);

        const generateUniqueUsername = (service as any).generateUniqueUsername.bind(service);
        const result = await generateUniqueUsername('', '', 'john.doe@example.com');

        expect(result).toBe('johndoe');
      });

      it('should add numeric suffix for conflicts', async () => {
        userService.isUsernameExists
          .mockResolvedValueOnce(true) // 'john' exists
          .mockResolvedValueOnce(false); // 'john1' is available

        const generateUniqueUsername = (service as any).generateUniqueUsername.bind(service);
        const result = await generateUniqueUsername('John', '', 'john@example.com');

        expect(result).toBe('john1');
      });

      it('should add random suffix after 99 attempts', async () => {
        // Mock 100 conflicts, then success
        userService.isUsernameExists.mockImplementation((username) => Promise.resolve(!username.match(/\d{4}$/)));

        const generateUniqueUsername = (service as any).generateUniqueUsername.bind(service);
        const result = await generateUniqueUsername('John', '', 'john@example.com');

        expect(result).toMatch(/^john\d{4}$/);
      });

      it('should throw error if unable to generate unique username', async () => {
        userService.isUsernameExists.mockResolvedValue(true);

        const generateUniqueUsername = (service as any).generateUniqueUsername.bind(service);

        await expect(generateUniqueUsername('John', '', 'john@example.com')).rejects.toThrow(BadRequestException);
      });

      it('should handle very long names by truncating', async () => {
        userService.isUsernameExists.mockResolvedValue(false);

        const generateUniqueUsername = (service as any).generateUniqueUsername.bind(service);
        const result = await generateUniqueUsername('VeryLongFirstName', 'VeryLongLastName', 'user@example.com');

        expect(result.length).toBeLessThanOrEqual(15);
        expect(result).toBe('verylongfirstna');
      });

      it('should clean special characters from names', async () => {
        userService.isUsernameExists.mockResolvedValue(false);

        const generateUniqueUsername = (service as any).generateUniqueUsername.bind(service);
        const result = await generateUniqueUsername('John-Paul', "O'Connor", 'user@example.com');

        expect(result).toBe('johnpauloconnor');
      });
    });

    describe('extractEmailPrefix', () => {
      it('should extract and clean email prefix', () => {
        const extractEmailPrefix = (service as any).extractEmailPrefix.bind(service);

        expect(extractEmailPrefix('john.doe+test@example.com')).toBe('johndoetest');
      });

      it('should truncate long email prefixes', () => {
        const extractEmailPrefix = (service as any).extractEmailPrefix.bind(service);
        const longEmail = 'verylongemailprefix@example.com';

        const result = extractEmailPrefix(longEmail);

        expect(result.length).toBeLessThanOrEqual(15);
        expect(result).toBe('verylongemailpr');
      });
    });

    describe('splitAndCleanName', () => {
      it('should split and clean name words', () => {
        const splitAndCleanName = (service as any).splitAndCleanName.bind(service);

        expect(splitAndCleanName("John-Paul O'Connor Jr.")).toEqual(['johnpaul', 'oconnor', 'jr']);
      });

      it('should handle empty and whitespace', () => {
        const splitAndCleanName = (service as any).splitAndCleanName.bind(service);

        expect(splitAndCleanName('  John   Paul  ')).toEqual(['john', 'paul']);
      });
    });

    describe('buildUsernameFromWords', () => {
      it('should build username from words within length limit', () => {
        const buildUsernameFromWords = (service as any).buildUsernameFromWords.bind(service);

        expect(buildUsernameFromWords(['john', 'paul', 'smith'])).toBe('johnpaulsmith');
      });

      it('should truncate when exceeding length limit', () => {
        const buildUsernameFromWords = (service as any).buildUsernameFromWords.bind(service);

        expect(buildUsernameFromWords(['verylongfirstname', 'verylonglastname'])).toBe('verylongfirstna');
      });

      it('should handle single long word', () => {
        const buildUsernameFromWords = (service as any).buildUsernameFromWords.bind(service);

        expect(buildUsernameFromWords(['verylongfirstnamethatexceedslimit'])).toBe('verylongfirstna');
      });
    });

    describe('generateUsernameVariant', () => {
      it('should add numeric suffix for low counters', () => {
        const generateUsernameVariant = (service as any).generateUsernameVariant.bind(service);

        expect(generateUsernameVariant('john', 5)).toBe('john5');
      });

      it('should truncate base for large numeric suffixes', () => {
        const generateUsernameVariant = (service as any).generateUsernameVariant.bind(service);

        expect(generateUsernameVariant('verylongusername', 99)).toBe('verylongusern99');
      });

      it('should add random suffix for high counters', () => {
        const generateUsernameVariant = (service as any).generateUsernameVariant.bind(service);

        const result = generateUsernameVariant('john', 100);

        expect(result).toMatch(/^john\d{4}$/);
        expect(result.length).toBeLessThanOrEqual(15);
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle JWT service failures gracefully', async () => {
      jwtService.signAsync.mockRejectedValue(new Error('JWT service unavailable'));
      userService.getUserWithCredentials.mockResolvedValue(mockUser);
      userService.verifyPassword.mockResolvedValue(true);

      const loginDto: LoginDto = { username: 'testuser', password: 'password123' };

      await expect(service.login(loginDto)).rejects.toThrow(BadRequestException);
    });

    it('should handle user service failures in OAuth validation', async () => {
      userService.findUserByEmail.mockRejectedValue(new Error('Database connection failed'));

      const oauthProfile = {
        email: 'oauth@example.com',
        firstName: 'OAuth',
        lastName: 'User',
        avatarUrl: 'https://example.com/avatar.jpg',
      };

      await expect(service.validateOAuthUser(oauthProfile, 'google')).rejects.toThrow('Database connection failed');
    });

    it('should handle edge case in username generation with empty names', async () => {
      userService.isUsernameExists.mockResolvedValue(false);

      const generateUniqueUsername = (service as any).generateUniqueUsername.bind(service);
      const result = await generateUniqueUsername('', '', 'a@b.c');

      expect(result).toBe('a');
    });

    it('should handle minimum length requirement in username generation', async () => {
      userService.isUsernameExists.mockResolvedValue(false);

      const generateUniqueUsername = (service as any).generateUniqueUsername.bind(service);
      const result = await generateUniqueUsername('A', '', 'longemail@example.com');

      expect(result.length).toBeGreaterThanOrEqual(3);
      expect(result).toBe('longemail');
    });
  });
});
