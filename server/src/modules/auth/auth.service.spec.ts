import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UserRole } from '../../common/enums/user-role.enum';

describe('AuthService', () => {
  let authService: AuthService;
  let userService: UserService;
  let jwtService: JwtService;
  let configService: ConfigService;

  const mockUser = {
    id: 1,
    username: '2110511091',
    password: 'hashedPassword123',
    fullName: 'Test User',
    role: UserRole.STUDENT,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUserService = {
    create: jest.fn(),
    getUserWithPassword: jest.fn(),
    findById: jest.fn(),
    verifyPassword: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: mockUserService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    userService = module.get<UserService>(UserService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);

    // Reset all mocks
    jest.clearAllMocks();

    // Default mock implementations
    mockConfigService.get.mockImplementation((key) => {
      if (key === 'jwt') {
        return {
          accessTokenSecret: 'test-access-secret',
          accessTokenExpires: '15m',
          refreshTokenSecret: 'test-refresh-secret',
          refreshTokenExpires: '7d',
        };
      }
      return undefined;
    });

    mockJwtService.signAsync.mockImplementation((payload, options) => {
      if (options.secret.includes('access')) {
        return Promise.resolve('mock-access-token');
      } else {
        return Promise.resolve('mock-refresh-token');
      }
    });
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const registerDto: RegisterDto = {
        username: '2110511091',
        password: 'Password123',
        fullName: 'Test User',
      };

      mockUserService.create.mockResolvedValue(mockUser);

      const result = await authService.register(registerDto);

      expect(mockUserService.create).toHaveBeenCalledWith(registerDto);
      expect(result).toEqual(mockUser);
    });
  });

  describe('login', () => {
    it('should return user data and tokens when credentials are valid', async () => {
      const loginDto: LoginDto = {
        username: '2110511091',
        password: 'Password123',
      };

      mockUserService.getUserWithPassword.mockResolvedValue(mockUser);
      mockUserService.verifyPassword.mockResolvedValue(true);

      const result = await authService.login(loginDto);

      expect(mockUserService.getUserWithPassword).toHaveBeenCalledWith(loginDto.username);
      expect(mockUserService.verifyPassword).toHaveBeenCalledWith(loginDto.password, mockUser.password);
      expect(mockJwtService.signAsync).toHaveBeenCalledTimes(2);
      expect(result).toEqual({
        user: {
          id: mockUser.id,
          username: mockUser.username,
          fullName: mockUser.fullName,
          role: mockUser.role,
          createdAt: mockUser.createdAt,
          updatedAt: mockUser.updatedAt,
        },
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      });
    });

    it('should throw UnauthorizedException when user not found', async () => {
      const loginDto: LoginDto = {
        username: 'nonexistent',
        password: 'Password123',
      };

      mockUserService.getUserWithPassword.mockResolvedValue(null);

      await expect(authService.login(loginDto)).rejects.toThrow(UnauthorizedException);
      expect(mockUserService.getUserWithPassword).toHaveBeenCalledWith(loginDto.username);
      expect(mockUserService.verifyPassword).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when password is invalid', async () => {
      const loginDto: LoginDto = {
        username: '2110511091',
        password: 'WrongPassword',
      };

      mockUserService.getUserWithPassword.mockResolvedValue(mockUser);
      mockUserService.verifyPassword.mockResolvedValue(false);

      await expect(authService.login(loginDto)).rejects.toThrow(UnauthorizedException);
      expect(mockUserService.getUserWithPassword).toHaveBeenCalledWith(loginDto.username);
      expect(mockUserService.verifyPassword).toHaveBeenCalledWith(loginDto.password, mockUser.password);
    });
  });

  describe('refreshToken', () => {
    it('should generate new tokens when user ID is valid', async () => {
      mockUserService.findById.mockResolvedValue(mockUser);

      const result = await authService.refreshToken(1);

      expect(mockUserService.findById).toHaveBeenCalledWith(1);
      expect(mockJwtService.signAsync).toHaveBeenCalledTimes(2);
      expect(result).toEqual({
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      });
    });

    it('should throw UnauthorizedException when user ID is invalid', async () => {
      mockUserService.findById.mockResolvedValue(null);

      await expect(authService.refreshToken(999)).rejects.toThrow(UnauthorizedException);
      expect(mockUserService.findById).toHaveBeenCalledWith(999);
    });
  });

  describe('generateTokens', () => {
    it('should call jwtService.signAsync with correct parameters', async () => {
      mockUserService.findById.mockResolvedValue(mockUser);
      await authService.refreshToken(1);

      // Check the first call - access token
      expect(mockJwtService.signAsync).toHaveBeenCalledWith(
        { sub: mockUser.id, username: mockUser.username, role: mockUser.role },
        {
          secret: 'test-access-secret',
          expiresIn: '15m',
        },
      );

      // Check the second call - refresh token
      expect(mockJwtService.signAsync).toHaveBeenCalledWith(
        { sub: mockUser.id, username: mockUser.username, role: mockUser.role },
        {
          secret: 'test-refresh-secret',
          expiresIn: '7d',
        },
      );
    });
  });

  describe('error handling', () => {
    it('should handle JwtService errors during token generation', async () => {
      mockUserService.findById.mockResolvedValue(mockUser);
      mockJwtService.signAsync.mockRejectedValue(new Error('JWT error'));

      await expect(authService.refreshToken(1)).rejects.toThrow();
    });

    it('should handle UserService errors during user lookup', async () => {
      mockUserService.findById.mockRejectedValue(new Error('Database error'));

      await expect(authService.refreshToken(1)).rejects.toThrow();
    });
  });
});
