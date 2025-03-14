import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { UserService } from '../user/user.service';
import { UserResponseDto } from '../user/dto/user-response.dto';
import { JWTConfig } from '../../config';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly jwtConfig: JWTConfig;

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.jwtConfig = this.configService.get<JWTConfig>('jwt')!;
  }

  async register(registerDto: RegisterDto) {
    return await this.userService.create(registerDto);
  }

  async login(loginDto: LoginDto) {
    const user = await this.userService.getUserWithCredentials(loginDto.username);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await this.userService.verifyPassword(loginDto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateAuthTokens(user);

    return {
      user: UserResponseDto.fromEntity(user),
      ...tokens,
    };
  }

  async refreshToken(userId: number) {
    try {
      const user = await this.userService.findById(userId);
      return this.generateAuthTokens(user);
    } catch (error) {
      this.logger.warn(`Failed token refresh attempt for user ID ${userId}: ${error.message}`);
      throw error;
    }
  }

  private async generateAuthTokens(user: UserResponseDto) {
    const payload: JwtPayload = {
      sub: user.id,
      username: user.username,
      role: user.role,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.jwtConfig.accessTokenSecret,
        expiresIn: this.jwtConfig.accessTokenExpires,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.jwtConfig.refreshTokenSecret,
        expiresIn: this.jwtConfig.refreshTokenExpires,
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }
}
