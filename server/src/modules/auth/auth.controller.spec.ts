import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UserRole } from '../../common/enums/user-role.enum';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';

describe('AuthController', () => {
  let authController: AuthController;
  let authService: AuthService;

  const mockUser = {
    id: 1,
    username: '2110511091',
    fullName: 'Test User',
    role: UserRole.STUDENT,
  };

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    refreshToken: jest.fn(),
  };

  const mockResponse = {
    cookie: jest.fn(),
    clearCookie: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(JwtRefreshGuard)
      .useValue({ canActivate: () => true })
      .compile();

    authController = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should create a new user', async () => {
      const registerDto: RegisterDto = {
        username: '2110511091',
        password: 'StrongP@ssw0rd',
        fullName: 'Test User',
      };

      mockAuthService.register.mockResolvedValue(mockUser);

      const result = await authController.register(registerDto);

      expect(mockAuthService.register).toHaveBeenCalledWith(registerDto);
      expect(result).toEqual(mockUser);
    });
  });

  describe('login', () => {
    it('should return access token and user data on successful login', async () => {
      const loginDto: LoginDto = {
        username: '2110511091',
        password: 'StrongP@ssw0rd',
      };

      const serviceResponse = {
        user: mockUser,
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };

      mockAuthService.login.mockResolvedValue(serviceResponse);

      const result = await authController.login(loginDto, mockResponse as any);

      expect(mockAuthService.login).toHaveBeenCalledWith(loginDto);
      expect(mockResponse.cookie).toHaveBeenCalledWith('refreshToken', 'refresh-token', expect.any(Object));
      expect(result).toEqual({
        user: mockUser,
        accessToken: 'access-token',
      });
      // Should not contain refreshToken in the response body
      expect(result).not.toHaveProperty('refreshToken');
    });

    it('should handle login failure', async () => {
      const loginDto: LoginDto = {
        username: 'wrong',
        password: 'wrong',
      };

      mockAuthService.login.mockRejectedValue(new UnauthorizedException('Invalid credentials'));

      await expect(authController.login(loginDto, mockResponse as any)).rejects.toThrow(UnauthorizedException);
      expect(mockAuthService.login).toHaveBeenCalledWith(loginDto);
      expect(mockResponse.cookie).not.toHaveBeenCalled();
    });
  });

  describe('refreshToken', () => {
    it('should return a new access token and set refresh token cookie', async () => {
      const user = { id: 1, username: '2110511091' };
      const tokens = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      };

      mockAuthService.refreshToken.mockResolvedValue(tokens);

      const result = await authController.refreshToken(user, mockResponse as any);

      expect(mockAuthService.refreshToken).toHaveBeenCalledWith(user.id);
      expect(mockResponse.cookie).toHaveBeenCalledWith('refreshToken', 'new-refresh-token', expect.any(Object));
      expect(result).toEqual({ accessToken: 'new-access-token' });
    });

    it('should handle refresh token failure', async () => {
      const user = { id: 999 };

      mockAuthService.refreshToken.mockRejectedValue(new UnauthorizedException('Invalid refresh token'));

      await expect(authController.refreshToken(user, mockResponse as any)).rejects.toThrow(UnauthorizedException);
      expect(mockAuthService.refreshToken).toHaveBeenCalledWith(user.id);
      expect(mockResponse.cookie).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should clear refresh token cookie', async () => {
      await authController.logout(mockResponse as any);

      expect(mockResponse.clearCookie).toHaveBeenCalledWith('refreshToken');
    });
  });
});
