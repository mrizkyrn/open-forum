import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { ReqUser } from '../../common/decorators/user.decorator';
import { User } from '../user/entities/user.entity';
import { COOKIE_OPTIONS } from './auth.constants';
import { AuthService } from './auth.service';
import { ChangePasswordDto, LoginDto, LoginResponseDto, LogoutResponseDto, RegisterDto, TokenResponseDto } from './dto';
import { GoogleOAuthGuard } from './guards/google-oauth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';

/**
 * Authentication Controller
 *
 * Handles all authentication-related HTTP requests including:
 * - User registration and login
 * - Token management (access & refresh)
 * - OAuth authentication (Google)
 * - Password management
 * - Session management
 */
@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ==================== PUBLIC AUTHENTICATION ====================

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register a new user account',
    description: 'Create a new user account with username and password authentication',
  })
  @ApiBody({
    type: RegisterDto,
    description: 'User registration data',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Registration successful - user can now login',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Registration successful! You can now log in.',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data or validation failed',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Username or email already exists',
  })
  async register(
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    registerDto: RegisterDto,
  ): Promise<{ message: string }> {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Authenticate user with credentials',
    description: 'Login with username/email and password to receive authentication tokens',
  })
  @ApiBody({
    type: LoginDto,
    description: 'User login credentials',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Login successful - access token provided, refresh token set as secure cookie',
    type: LoginResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid credentials provided',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async login(
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<LoginResponseDto> {
    const result = await this.authService.login(loginDto);

    // Extract refresh token for secure cookie
    const { refreshToken, ...responseData } = result;
    response.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);

    return responseData as LoginResponseDto;
  }

  // ==================== TOKEN MANAGEMENT ====================

  @Post('refresh')
  @UseGuards(JwtRefreshGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh authentication tokens',
    description: 'Generate new access token using valid refresh token from secure cookie',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Token refreshed successfully - new access token provided',
    type: TokenResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid or expired refresh token',
  })
  async refreshToken(@ReqUser() user: any, @Res({ passthrough: true }) response: Response): Promise<TokenResponseDto> {
    const results = await this.authService.refreshToken(user.id);

    // Set new refresh token in secure cookie
    const { refreshToken, ...responseData } = results;
    response.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);

    return responseData as TokenResponseDto;
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Logout current user',
    description: 'Invalidate user session and clear authentication cookies',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Logout successful - session cleared',
    type: LogoutResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication required',
  })
  async logout(@ReqUser() user: User, @Res({ passthrough: true }) response: Response): Promise<LogoutResponseDto> {
    // Clear refresh token cookie
    response.clearCookie('refreshToken');

    // Call service to handle any additional logout logic
    return this.authService.logout(user.id);
  }

  // ==================== PASSWORD MANAGEMENT ====================

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Change user password',
    description: 'Change password for the currently authenticated user',
  })
  @ApiBody({
    type: ChangePasswordDto,
    description: 'Current and new password data',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password changed successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Password changed successfully',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication required or current password incorrect',
  })
  async changePassword(
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    changePasswordDto: ChangePasswordDto,
    @ReqUser() user: User,
  ): Promise<{ message: string }> {
    return this.authService.changePassword(user.id, changePasswordDto);
  }

  // ==================== OAUTH AUTHENTICATION ====================

  @Get('google')
  @UseGuards(GoogleOAuthGuard)
  @ApiOperation({
    summary: 'Initiate Google OAuth authentication',
    description: 'Redirect user to Google OAuth consent page',
  })
  @ApiResponse({
    status: HttpStatus.FOUND,
    description: 'Redirecting to Google OAuth',
  })
  async googleAuth(): Promise<void> {
    // Guard will handle the redirect to Google
  }

  @Get('google/callback')
  @UseGuards(GoogleOAuthGuard)
  @ApiOperation({
    summary: 'Handle Google OAuth callback',
    description: 'Process Google OAuth response and authenticate user',
  })
  @ApiResponse({
    status: HttpStatus.FOUND,
    description: 'OAuth successful - redirecting to frontend with token',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'OAuth authentication failed',
  })
  async googleAuthRedirect(@Req() req: Request, @Res() res: Response): Promise<void> {
    try {
      const user = req.user as any;

      if (!user) {
        throw new BadRequestException('OAuth authentication failed');
      }

      const result = await this.authService.oauthLogin(user);

      // Set refresh token in secure cookie
      const { refreshToken } = result;
      res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);

      // Redirect to frontend with access token
      const frontendUrl = process.env.CLIENT_URL || 'http://localhost:3000';
      const redirectUrl = `${frontendUrl}/auth/oauth-success?token=${result.accessToken}`;

      res.redirect(redirectUrl);
    } catch (error) {
      // Redirect to frontend with error
      const frontendUrl = process.env.CLIENT_URL || 'http://localhost:3000';
      const errorRedirectUrl = `${frontendUrl}/auth/oauth-error?message=${encodeURIComponent(error.message)}`;

      res.redirect(errorRedirectUrl);
    }
  }
}
