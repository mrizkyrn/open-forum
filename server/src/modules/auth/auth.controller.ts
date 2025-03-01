import { Controller, Post, Body, HttpCode, HttpStatus, Get, Req, UseGuards, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { Response } from 'express';
import { ReqUser } from '../../common/decorators/user.decorator';
import { COOKIE_OPTIONS } from './auth.constants';
import { LoginResponseDto, TokenResponseDto, UserResponseDto } from './dto/auth-response.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ status: 201, description: 'User created successfully', type: UserResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 409, description: 'Username already exists' })
  async register(@Body() registerDto: CreateUserDto): Promise<UserResponseDto> {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with username and password' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Login successful', type: LoginResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) response: Response): Promise<LoginResponseDto> {
    // Get tokens and user info from auth service
    const result = await this.authService.login(loginDto);

    // Extract refresh token and remove it from the response
    const { refreshToken, ...responseData } = result;

    // Store refresh token in HTTP-only cookie
    response.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);

    // Return everything else (access token and user data)
    return responseData;
  }

  @Post('refresh')
  @UseGuards(JwtRefreshGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully', type: TokenResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refreshToken(@ReqUser() user: any, @Res({ passthrough: true }) response: Response): Promise<TokenResponseDto> {
    // Generate new tokens
    const tokens = await this.authService.refreshToken(user.id);

    // Set the new refresh token in cookie
    response.cookie('refreshToken', tokens.refreshToken, COOKIE_OPTIONS);

    // Return only the access token
    return { accessToken: tokens.accessToken };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@ReqUser() ReqUser: any) {
    return ReqUser;
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async logout(@Res({ passthrough: true }) response: Response): Promise<void> {
    response.clearCookie('refreshToken');
  }
}
