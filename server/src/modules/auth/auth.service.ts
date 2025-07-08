import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '../../common/enums/user-role.enum';
import { JWTConfig } from '../../config';
import { UserResponseDto } from '../user/dto/user-response.dto';
import { User } from '../user/entities/user.entity';
import { UserService } from '../user/user.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

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

  async register(registerDto: RegisterDto): Promise<{ message: string }> {
    try {
      await this.userService.create({
        username: registerDto.username,
        password: registerDto.password,
        fullName: registerDto.fullName,
        email: registerDto.email,
        role: UserRole.STUDENT,
      });

      return {
        message: 'Registration successful! You can now log in.',
      };
    } catch (error) {
      this.logger.warn(`Failed registration attempt for username ${registerDto.username}: ${error.message}`);
      throw error;
    }
  }

  async login(loginDto: LoginDto) {
    try {
      const user = await this.userService.getUserWithCredentials(loginDto.username);
      if (!user || !user.password) {
        throw new UnauthorizedException('Incorrect username or password');
      }

      const isPasswordValid = await this.userService.verifyPassword(loginDto.password, user.password);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Incorrect username or password');
      }

      const tokens = await this.generateAuthTokens(user);
      return {
        user: UserResponseDto.fromEntity(user),
        ...tokens,
      };
    } catch (error) {
      this.logger.warn(`Failed login attempt for username ${loginDto.username}: ${error.message}`);
      throw error;
    }
  }

  async refreshToken(userId: number) {
    try {
      const user = await this.userService.getUserEntity(userId);
      return this.generateAuthTokens(user);
    } catch (error) {
      this.logger.warn(`Failed token refresh attempt for user ID ${userId}: ${error.message}`);
      throw error;
    }
  }

  private async generateAuthTokens(user: User) {
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

  async validateOAuthUser(profile: any, provider: string): Promise<User> {
    const { email, firstName, lastName, avatarUrl } = profile;

    // Check if user already exists
    let user = await this.userService.findUserByEmail(email);

    if (user) {
      // Update user with OAuth info if needed
      this.logger.debug(`Found existing user: ${avatarUrl}`);
      if (!user.avatarUrl && avatarUrl) {
        user.avatarUrl = avatarUrl;
        await this.userService.updateUser(user.id, { avatarUrl: avatarUrl });
      }
      return user;
    }

    // Create new user from OAuth profile
    const fullName = `${firstName} ${lastName}`.trim();
    const generatedUsername = await this.generateUniqueUsername(firstName, lastName, email);

    this.logger.debug(
      `Creating new user from OAuth profile: ${avatarUrl} (${email}) with username: ${generatedUsername}`,
    );
    return await this.userService.createOAuthUser({
      email,
      fullName: fullName || email.split('@')[0],
      avatarUrl: avatarUrl,
      provider,
      role: UserRole.STUDENT,
      username: generatedUsername,
    });
  }

  private async generateUniqueUsername(firstName: string, lastName: string, email: string): Promise<string> {
    // Strategy 1: Use first name + last name (e.g., johnsmith)
    let baseUsername = '';

    if (firstName && lastName) {
      baseUsername = `${firstName}${lastName}`.toLowerCase().replace(/[^a-z0-9]/g, '');
    } else if (firstName) {
      baseUsername = firstName.toLowerCase().replace(/[^a-z0-9]/g, '');
    } else {
      // Fallback to email prefix
      baseUsername = email
        .split('@')[0]
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
    }

    // Ensure minimum length
    if (baseUsername.length < 3) {
      baseUsername = email
        .split('@')[0]
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
    }

    // Limit length to reasonable size
    if (baseUsername.length > 15) {
      baseUsername = baseUsername.substring(0, 15);
    }

    // Check if username is available
    let finalUsername = baseUsername;
    let counter = 1;

    while (await this.userService.isUsernameExists(finalUsername)) {
      // Strategy 2: Add numbers (e.g., johnsmith1, johnsmith2)
      if (counter <= 99) {
        finalUsername = `${baseUsername}${counter}`;
      } else {
        // Strategy 3: Add random suffix for very common names
        const randomSuffix = Math.floor(Math.random() * 9999)
          .toString()
          .padStart(4, '0');
        finalUsername = `${baseUsername}${randomSuffix}`;
        break; // Exit to avoid infinite loop
      }
      counter++;
    }

    return finalUsername;
  }

  async oauthLogin(user: User) {
    const tokens = await this.generateAuthTokens(user);
    return {
      user: UserResponseDto.fromEntity(user),
      ...tokens,
    };
  }
}
