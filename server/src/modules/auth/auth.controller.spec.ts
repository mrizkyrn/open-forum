import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Request, Response } from 'express';
import { UserRole } from '../../common/enums/user-role.enum';
import { UserResponseDto } from '../user/dto/user-response.dto';
import { User } from '../user/entities/user.entity';
import { COOKIE_OPTIONS } from './auth.constants';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ChangePasswordDto, LoginDto, LoginResponseDto, LogoutResponseDto, RegisterDto } from './dto';

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
 * Mock factory for creating LoginResponseDto
 */
const createMockLoginResponse = (overrides: Partial<LoginResponseDto> = {}): LoginResponseDto => {
  const response = new LoginResponseDto();
  response.user = UserResponseDto.fromEntity(createMockUser());
  response.accessToken = 'mock-access-token';
  response.expiresIn = 3600;
  response.tokenType = 'Bearer';

  return Object.assign(response, overrides);
};

/**
 * Mock factory for creating Express Response
 */
const createMockResponse = (): Partial<Response> => ({
  cookie: jest.fn(),
  clearCookie: jest.fn(),
  redirect: jest.fn(),
});

/**
 * Mock factory for creating Express Request
 */
const createMockRequest = (overrides: Partial<Request> = {}): Partial<Request> => ({
  user: createMockUser(),
  ...overrides,
});

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  // Test data
  let mockUser: User;
  let mockRegisterDto: RegisterDto;
  let mockLoginDto: LoginDto;
  let mockChangePasswordDto: ChangePasswordDto;
  let mockLoginResponse: LoginResponseDto & { refreshToken: string };
  let mockResponse: Partial<Response>;
  let mockRequest: Partial<Request>;

  beforeEach(async () => {
    // Create mock AuthService
    const mockAuthService = {
      register: jest.fn(),
      login: jest.fn(),
      refreshToken: jest.fn(),
      logout: jest.fn(),
      changePassword: jest.fn(),
      oauthLogin: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);

    // Setup test data
    mockUser = createMockUser();
    mockResponse = createMockResponse();
    mockRequest = createMockRequest();

    mockRegisterDto = {
      username: 'newuser',
      fullName: 'New User',
      email: 'new@example.com',
      password: 'password123',
    };

    mockLoginDto = {
      username: 'testuser',
      password: 'password123',
    };

    mockChangePasswordDto = {
      currentPassword: 'oldpassword',
      newPassword: 'newpassword123',
    };

    mockLoginResponse = {
      ...createMockLoginResponse(),
      refreshToken: 'mock-refresh-token',
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Controller Initialization', () => {
    it('should be defined', () => {
      expect(controller).toBeDefined();
    });
  });

  // ==================== PUBLIC AUTHENTICATION ====================

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const mockResponse = { message: 'Registration successful! You can now log in.' };
      authService.register.mockResolvedValue(mockResponse);

      const result = await controller.register(mockRegisterDto);

      expect(result).toEqual(mockResponse);
      expect(authService.register).toHaveBeenCalledWith(mockRegisterDto);
    });

    it('should handle registration with email', async () => {
      const registerWithEmail = {
        ...mockRegisterDto,
        email: 'user@example.com',
      };
      const mockResponse = { message: 'Registration successful! You can now log in.' };
      authService.register.mockResolvedValue(mockResponse);

      const result = await controller.register(registerWithEmail);

      expect(result).toEqual(mockResponse);
      expect(authService.register).toHaveBeenCalledWith(registerWithEmail);
    });

    it('should handle registration without email', async () => {
      const registerWithoutEmail = {
        username: 'newuser',
        fullName: 'New User',
        password: 'password123',
      } as RegisterDto;
      const mockResponse = { message: 'Registration successful! You can now log in.' };
      authService.register.mockResolvedValue(mockResponse);

      const result = await controller.register(registerWithoutEmail);

      expect(result).toEqual(mockResponse);
      expect(authService.register).toHaveBeenCalledWith(registerWithoutEmail);
    });

    it('should throw ConflictException for existing username', async () => {
      authService.register.mockRejectedValue(new BadRequestException('Username already exists'));

      await expect(controller.register(mockRegisterDto)).rejects.toThrow(BadRequestException);
      expect(authService.register).toHaveBeenCalledWith(mockRegisterDto);
    });

    it('should handle validation errors', async () => {
      const invalidRegisterDto = {
        username: '',
        fullName: '',
        password: '123',
      } as RegisterDto;

      authService.register.mockRejectedValue(new BadRequestException('Invalid input data'));

      await expect(controller.register(invalidRegisterDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('login', () => {
    it('should login user successfully and set refresh token cookie', async () => {
      authService.login.mockResolvedValue(mockLoginResponse);

      const result = await controller.login(mockLoginDto, mockResponse as Response);

      expect(result).toEqual({
        user: mockLoginResponse.user,
        accessToken: mockLoginResponse.accessToken,
        expiresIn: mockLoginResponse.expiresIn,
        tokenType: 'Bearer',
      });
      expect(authService.login).toHaveBeenCalledWith(mockLoginDto);
      expect(mockResponse.cookie).toHaveBeenCalledWith('refreshToken', 'mock-refresh-token', COOKIE_OPTIONS);
    });

    it('should handle login with email instead of username', async () => {
      const loginWithEmail = {
        username: 'user@example.com',
        password: 'password123',
      };
      authService.login.mockResolvedValue(mockLoginResponse);

      const result = await controller.login(loginWithEmail, mockResponse as Response);

      expect(result).toBeDefined();
      expect(authService.login).toHaveBeenCalledWith(loginWithEmail);
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      authService.login.mockRejectedValue(new UnauthorizedException('Invalid credentials'));

      await expect(controller.login(mockLoginDto, mockResponse as Response)).rejects.toThrow(UnauthorizedException);
      expect(authService.login).toHaveBeenCalledWith(mockLoginDto);
      expect(mockResponse.cookie).not.toHaveBeenCalled();
    });

    it('should handle service errors during login', async () => {
      authService.login.mockRejectedValue(new Error('Database connection failed'));

      await expect(controller.login(mockLoginDto, mockResponse as Response)).rejects.toThrow(Error);
      expect(mockResponse.cookie).not.toHaveBeenCalled();
    });
  });

  // ==================== TOKEN MANAGEMENT ====================

  describe('refreshToken', () => {
    it('should refresh tokens successfully', async () => {
      const mockTokens = {
        accessToken: 'new-access-token',
        expiresIn: 3600,
        tokenType: 'Bearer',
        issuedAt: new Date(),
        refreshToken: 'new-refresh-token',
      };
      authService.refreshToken.mockResolvedValue(mockTokens);

      const result = await controller.refreshToken(mockUser, mockResponse as Response);

      expect(result).toMatchObject({
        accessToken: 'new-access-token',
        expiresIn: 3600,
        tokenType: 'Bearer',
      });
      expect(result.issuedAt).toBeInstanceOf(Date);
      expect(authService.refreshToken).toHaveBeenCalledWith(mockUser.id);
      expect(mockResponse.cookie).toHaveBeenCalledWith('refreshToken', 'new-refresh-token', COOKIE_OPTIONS);
    });

    it('should handle refresh token failure', async () => {
      authService.refreshToken.mockRejectedValue(new UnauthorizedException('Token refresh failed'));

      await expect(controller.refreshToken(mockUser, mockResponse as Response)).rejects.toThrow(UnauthorizedException);
      expect(authService.refreshToken).toHaveBeenCalledWith(mockUser.id);
      expect(mockResponse.cookie).not.toHaveBeenCalled();
    });

    it('should handle user not found during token refresh', async () => {
      authService.refreshToken.mockRejectedValue(new BadRequestException('User not found'));

      await expect(controller.refreshToken(mockUser, mockResponse as Response)).rejects.toThrow(BadRequestException);
    });
  });

  describe('logout', () => {
    it('should logout user successfully and clear refresh token cookie', async () => {
      const mockLogoutResponse = LogoutResponseDto.create('Successfully logged out');
      authService.logout.mockResolvedValue(mockLogoutResponse);

      const result = await controller.logout(mockUser, mockResponse as Response);

      expect(result).toEqual(mockLogoutResponse);
      expect(authService.logout).toHaveBeenCalledWith(mockUser.id);
      expect(mockResponse.clearCookie).toHaveBeenCalledWith('refreshToken');
    });

    it('should handle logout service errors', async () => {
      authService.logout.mockRejectedValue(new BadRequestException('Logout failed'));

      await expect(controller.logout(mockUser, mockResponse as Response)).rejects.toThrow(BadRequestException);
      expect(mockResponse.clearCookie).toHaveBeenCalledWith('refreshToken');
    });

    it('should clear cookie even if service call fails', async () => {
      authService.logout.mockRejectedValue(new Error('Service error'));

      await expect(controller.logout(mockUser, mockResponse as Response)).rejects.toThrow(Error);
      expect(mockResponse.clearCookie).toHaveBeenCalledWith('refreshToken');
    });
  });

  // ==================== PASSWORD MANAGEMENT ====================

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const mockResponse = { message: 'Password changed successfully' };
      authService.changePassword.mockResolvedValue(mockResponse);

      const result = await controller.changePassword(mockChangePasswordDto, mockUser);

      expect(result).toEqual(mockResponse);
      expect(authService.changePassword).toHaveBeenCalledWith(mockUser.id, mockChangePasswordDto);
    });

    it('should throw UnauthorizedException for incorrect current password', async () => {
      authService.changePassword.mockRejectedValue(new UnauthorizedException('Current password is incorrect'));

      await expect(controller.changePassword(mockChangePasswordDto, mockUser)).rejects.toThrow(UnauthorizedException);
      expect(authService.changePassword).toHaveBeenCalledWith(mockUser.id, mockChangePasswordDto);
    });

    it('should handle validation errors for weak passwords', async () => {
      const weakPasswordDto = {
        currentPassword: 'oldpassword',
        newPassword: '123',
      };
      authService.changePassword.mockRejectedValue(new BadRequestException('Password too weak'));

      await expect(controller.changePassword(weakPasswordDto, mockUser)).rejects.toThrow(BadRequestException);
    });

    it('should handle same current and new password', async () => {
      const samePasswordDto = {
        currentPassword: 'password123',
        newPassword: 'password123',
      };
      authService.changePassword.mockRejectedValue(
        new BadRequestException('New password must be different from current password'),
      );

      await expect(controller.changePassword(samePasswordDto, mockUser)).rejects.toThrow(BadRequestException);
    });
  });

  // ==================== OAUTH AUTHENTICATION ====================

  describe('googleAuth', () => {
    it('should initiate Google OAuth flow', async () => {
      // This is handled by the GoogleOAuthGuard, so we just verify the method exists
      const result = await controller.googleAuth();
      expect(result).toBeUndefined();
    });
  });

  describe('googleAuthRedirect', () => {
    beforeEach(() => {
      process.env.CLIENT_URL = 'http://localhost:3000';
    });

    afterEach(() => {
      delete process.env.CLIENT_URL;
    });

    it('should handle successful Google OAuth callback', async () => {
      const oauthUser = createMockUser({ email: 'oauth@example.com' });
      const mockOAuthRequest = createMockRequest({ user: oauthUser });
      authService.oauthLogin.mockResolvedValue(mockLoginResponse);

      await controller.googleAuthRedirect(mockOAuthRequest as Request, mockResponse as Response);

      expect(authService.oauthLogin).toHaveBeenCalledWith(oauthUser);
      expect(mockResponse.cookie).toHaveBeenCalledWith('refreshToken', 'mock-refresh-token', COOKIE_OPTIONS);
      expect(mockResponse.redirect).toHaveBeenCalledWith(
        'http://localhost:3000/auth/oauth-success?token=mock-access-token',
      );
    });

    it('should handle OAuth callback without user', async () => {
      const mockOAuthRequest = createMockRequest({ user: undefined });

      await controller.googleAuthRedirect(mockOAuthRequest as Request, mockResponse as Response);

      expect(authService.oauthLogin).not.toHaveBeenCalled();
      expect(mockResponse.redirect).toHaveBeenCalledWith(
        'http://localhost:3000/auth/oauth-error?message=OAuth%20authentication%20failed',
      );
    });

    it('should handle OAuth service errors', async () => {
      const oauthUser = createMockUser({ email: 'oauth@example.com' });
      const mockOAuthRequest = createMockRequest({ user: oauthUser });
      authService.oauthLogin.mockRejectedValue(new Error('OAuth service error'));

      await controller.googleAuthRedirect(mockOAuthRequest as Request, mockResponse as Response);

      expect(mockResponse.redirect).toHaveBeenCalledWith(
        'http://localhost:3000/auth/oauth-error?message=OAuth%20service%20error',
      );
    });

    it('should use default CLIENT_URL when not set', async () => {
      delete process.env.CLIENT_URL;
      const oauthUser = createMockUser({ email: 'oauth@example.com' });
      const mockOAuthRequest = createMockRequest({ user: oauthUser });
      authService.oauthLogin.mockResolvedValue(mockLoginResponse);

      await controller.googleAuthRedirect(mockOAuthRequest as Request, mockResponse as Response);

      expect(mockResponse.redirect).toHaveBeenCalledWith(
        'http://localhost:3000/auth/oauth-success?token=mock-access-token',
      );
    });

    it('should handle OAuth with existing user account', async () => {
      const existingUser = createMockUser({
        email: 'existing@example.com',
        oauthProvider: 'google',
      });
      const mockOAuthRequest = createMockRequest({ user: existingUser });
      authService.oauthLogin.mockResolvedValue(mockLoginResponse);

      await controller.googleAuthRedirect(mockOAuthRequest as Request, mockResponse as Response);

      expect(authService.oauthLogin).toHaveBeenCalledWith(existingUser);
      expect(mockResponse.redirect).toHaveBeenCalledWith(
        'http://localhost:3000/auth/oauth-success?token=mock-access-token',
      );
    });
  });

  // ==================== ERROR HANDLING TESTS ====================

  describe('Error Handling', () => {
    it('should propagate service errors correctly in register', async () => {
      const serviceError = new Error('Service unavailable');
      authService.register.mockRejectedValue(serviceError);

      await expect(controller.register(mockRegisterDto)).rejects.toThrow(serviceError);
    });

    it('should propagate service errors correctly in login', async () => {
      const serviceError = new Error('Database connection failed');
      authService.login.mockRejectedValue(serviceError);

      await expect(controller.login(mockLoginDto, mockResponse as Response)).rejects.toThrow(serviceError);
    });

    it('should propagate service errors correctly in changePassword', async () => {
      const serviceError = new Error('Password update failed');
      authService.changePassword.mockRejectedValue(serviceError);

      await expect(controller.changePassword(mockChangePasswordDto, mockUser)).rejects.toThrow(serviceError);
    });
  });

  // ==================== INTEGRATION TESTS ====================

  describe('Integration Tests', () => {
    it('should handle complete authentication workflow', async () => {
      // Step 1: Register user
      const registerResponse = { message: 'Registration successful! You can now log in.' };
      authService.register.mockResolvedValue(registerResponse);
      const regResult = await controller.register(mockRegisterDto);
      expect(regResult).toEqual(registerResponse);

      // Step 2: Login user
      authService.login.mockResolvedValue(mockLoginResponse);
      const loginResult = await controller.login(mockLoginDto, mockResponse as Response);
      expect(loginResult).toBeDefined();
      expect(mockResponse.cookie).toHaveBeenCalled();

      // Step 3: Change password
      const passwordResponse = { message: 'Password changed successfully' };
      authService.changePassword.mockResolvedValue(passwordResponse);
      const passwordResult = await controller.changePassword(mockChangePasswordDto, mockUser);
      expect(passwordResult).toEqual(passwordResponse);

      // Step 4: Logout
      const logoutResponse = LogoutResponseDto.create('Successfully logged out');
      authService.logout.mockResolvedValue(logoutResponse);
      const logoutResult = await controller.logout(mockUser, mockResponse as Response);
      expect(logoutResult).toEqual(logoutResponse);
      expect(mockResponse.clearCookie).toHaveBeenCalled();
    });

    it('should handle token refresh workflow', async () => {
      // Step 1: Initial login
      authService.login.mockResolvedValue(mockLoginResponse);
      await controller.login(mockLoginDto, mockResponse as Response);

      // Step 2: Refresh token
      const newTokens = {
        accessToken: 'new-access-token',
        expiresIn: 3600,
        tokenType: 'Bearer',
        issuedAt: new Date(),
        refreshToken: 'new-refresh-token',
      };
      authService.refreshToken.mockResolvedValue(newTokens);
      const refreshResult = await controller.refreshToken(mockUser, mockResponse as Response);

      expect(refreshResult.accessToken).toBe('new-access-token');
      expect(mockResponse.cookie).toHaveBeenCalledWith('refreshToken', 'new-refresh-token', COOKIE_OPTIONS);
    });

    it('should handle OAuth authentication workflow', async () => {
      const oauthUser = createMockUser({ email: 'oauth@example.com' });
      const mockOAuthRequest = createMockRequest({ user: oauthUser });

      // OAuth login
      authService.oauthLogin.mockResolvedValue(mockLoginResponse);
      await controller.googleAuthRedirect(mockOAuthRequest as Request, mockResponse as Response);

      expect(authService.oauthLogin).toHaveBeenCalledWith(oauthUser);
      expect(mockResponse.cookie).toHaveBeenCalled();
      expect(mockResponse.redirect).toHaveBeenCalled();
    });
  });

  // ==================== EDGE CASES ====================

  describe('Edge Cases', () => {
    it('should handle registration with minimum valid data', async () => {
      const minimalRegisterDto = {
        username: 'min',
        fullName: 'M',
        password: 'password123',
      } as RegisterDto;
      const mockResponse = { message: 'Registration successful! You can now log in.' };
      authService.register.mockResolvedValue(mockResponse);

      const result = await controller.register(minimalRegisterDto);
      expect(result).toEqual(mockResponse);
    });

    it('should handle login with very long username', async () => {
      const longUsernameDto = {
        username: 'a'.repeat(25),
        password: 'password123',
      };
      authService.login.mockResolvedValue(mockLoginResponse);

      const result = await controller.login(longUsernameDto, mockResponse as Response);
      expect(result).toBeDefined();
    });

    it('should handle password change with complex passwords', async () => {
      const complexPasswordDto = {
        currentPassword: 'oldComplexP@ss123!',
        newPassword: 'newComplexP@ss456#',
      };
      const mockResponse = { message: 'Password changed successfully' };
      authService.changePassword.mockResolvedValue(mockResponse);

      const result = await controller.changePassword(complexPasswordDto, mockUser);
      expect(result).toEqual(mockResponse);
    });

    it('should handle OAuth with undefined environment variables', async () => {
      delete process.env.CLIENT_URL;
      const oauthUser = createMockUser();
      const mockOAuthRequest = createMockRequest({ user: oauthUser });
      authService.oauthLogin.mockResolvedValue(mockLoginResponse);

      await controller.googleAuthRedirect(mockOAuthRequest as Request, mockResponse as Response);

      expect(mockResponse.redirect).toHaveBeenCalledWith(expect.stringContaining('http://localhost:3000'));
    });
  });

  // ==================== SECURITY TESTS ====================

  describe('Security Tests', () => {
    it('should ensure refresh token is set with secure cookie options', async () => {
      authService.login.mockResolvedValue(mockLoginResponse);

      await controller.login(mockLoginDto, mockResponse as Response);

      expect(mockResponse.cookie).toHaveBeenCalledWith('refreshToken', 'mock-refresh-token', COOKIE_OPTIONS);
    });

    it('should ensure refresh token cookie is cleared on logout', async () => {
      const logoutResponse = LogoutResponseDto.create('Successfully logged out');
      authService.logout.mockResolvedValue(logoutResponse);

      await controller.logout(mockUser, mockResponse as Response);

      expect(mockResponse.clearCookie).toHaveBeenCalledWith('refreshToken');
    });

    it('should ensure user can only change their own password', async () => {
      const passwordResponse = { message: 'Password changed successfully' };
      authService.changePassword.mockResolvedValue(passwordResponse);

      await controller.changePassword(mockChangePasswordDto, mockUser);

      // Verify that the service is called with the current user's ID
      expect(authService.changePassword).toHaveBeenCalledWith(mockUser.id, mockChangePasswordDto);
    });

    it('should ensure user can only logout themselves', async () => {
      const logoutResponse = LogoutResponseDto.create('Successfully logged out');
      authService.logout.mockResolvedValue(logoutResponse);

      await controller.logout(mockUser, mockResponse as Response);

      // Verify that the service is called with the current user's ID
      expect(authService.logout).toHaveBeenCalledWith(mockUser.id);
    });

    it('should handle OAuth error with properly encoded error message', async () => {
      const oauthUser = createMockUser();
      const mockOAuthRequest = createMockRequest({ user: oauthUser });
      const errorMessage = 'OAuth failed: Special characters @#$%';
      authService.oauthLogin.mockRejectedValue(new Error(errorMessage));

      await controller.googleAuthRedirect(mockOAuthRequest as Request, mockResponse as Response);

      expect(mockResponse.redirect).toHaveBeenCalledWith(expect.stringContaining(encodeURIComponent(errorMessage)));
    });
  });
});
