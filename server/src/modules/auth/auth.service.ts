import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../user/user.service';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from './dto/register.dto';
import { User } from '../user/entities/user.entity';
import { JWTConfig } from '../../config';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(registerDto: CreateUserDto) {
    return await this.userService.create(registerDto);
  }

  async login(loginDto: LoginDto) {
    // Find user by username
    const user = await this.userService.getUserWithPassword(loginDto.username);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await this.userService.verifyPassword(loginDto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate tokens
    const tokens = await this.generateTokens(user);

    return {
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
      },
      ...tokens,
    };
  }

  async refreshToken(userId: number) {
    const user = await this.userService.findById(userId);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return this.generateTokens(user);
  }

  private async generateTokens(user: User) {
    const payload = { sub: user.id, username: user.username, role: user.role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<JWTConfig>('jwt')!.accessTokenSecret,
        expiresIn: this.configService.get<JWTConfig>('jwt')!.accessTokenExpires,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<JWTConfig>('jwt')!.refreshTokenSecret,
        expiresIn: this.configService.get<JWTConfig>('jwt')!.refreshTokenExpires,
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }
}
