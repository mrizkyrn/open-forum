import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { ReqUser } from '../../common/decorators/user.decorator';
import { COOKIE_OPTIONS } from './auth.constants';
import { AuthService } from './auth.service';
import { LoginResponseDto, TokenResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { GoogleOAuthGuard } from './guards/google-oauth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user account' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ status: 201, description: 'Registration successful', type: LoginResponseDto })
  @ApiResponse({ status: 409, description: 'Username or email already exists' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async register(
    @Body() registerDto: RegisterDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ message: string }> {
    const result = await this.authService.register(registerDto);
    return result;
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with username and password' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Login successful', type: LoginResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) response: Response): Promise<LoginResponseDto> {
    const result = await this.authService.login(loginDto);

    const { refreshToken, ...responseData } = result;
    response.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);

    return responseData;
  }

  @Post('refresh')
  @UseGuards(JwtRefreshGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully', type: TokenResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refreshToken(@ReqUser() user: any, @Res({ passthrough: true }) response: Response): Promise<TokenResponseDto> {
    const tokens = await this.authService.refreshToken(user.id);

    response.cookie('refreshToken', tokens.refreshToken, COOKIE_OPTIONS);

    return { accessToken: tokens.accessToken };
  }

  @Post('logout')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async logout(@Res({ passthrough: true }) response: Response): Promise<void> {
    response.clearCookie('refreshToken');
  }

  // OAuth Google endpoints
  @Get('google')
  @UseGuards(GoogleOAuthGuard)
  @ApiOperation({ summary: 'Initiate Google OAuth login' })
  async googleAuth(@Req() req: Request) {
    // Guard will redirect to Google
  }

  @Get('google/callback')
  @UseGuards(GoogleOAuthGuard)
  @ApiOperation({ summary: 'Google OAuth callback' })
  async googleAuthRedirect(@Req() req: Request, @Res() res: Response): Promise<void> {
    const user = req.user as any;
    const result = await this.authService.oauthLogin(user);

    const { refreshToken } = result;
    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);

    // Return user data with access token and redirect to frontend with access token
    const frontendUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/auth/oauth-success?token=${result.accessToken}`);
  }
}
