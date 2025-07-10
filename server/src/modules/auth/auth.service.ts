import { Inject, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '../../common/enums/user-role.enum';
import { jwtConfig } from '../../config';
import { UserResponseDto } from '../user/dto/user-response.dto';
import { User } from '../user/entities/user.entity';
import { UserService } from '../user/user.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject(jwtConfig.KEY)
    private readonly jwtConfigService: ConfigType<typeof jwtConfig>,
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<{ message: string }> {
    try {
      await this.userService.create({
        username: registerDto.username,
        password: registerDto.password,
        fullName: registerDto.fullName,
        email: registerDto.email,
        role: UserRole.USER,
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

  async oauthLogin(user: User) {
    const tokens = await this.generateAuthTokens(user);
    return {
      user: UserResponseDto.fromEntity(user),
      ...tokens,
    };
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
        secret: this.jwtConfigService.accessTokenSecret,
        expiresIn: this.jwtConfigService.accessTokenExpires,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.jwtConfigService.refreshTokenSecret,
        expiresIn: this.jwtConfigService.refreshTokenExpires,
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
      role: UserRole.USER,
      username: generatedUsername,
    });
  }

  private async generateUniqueUsername(firstName: string, lastName: string, email: string): Promise<string> {
    let baseUsername = '';

    if (firstName && lastName) {
      // Split names into individual words and clean them
      const firstNameWords = firstName
        .toLowerCase()
        .split(/\s+/)
        .filter((word) => word.length > 0);
      const lastNameWords = lastName
        .toLowerCase()
        .split(/\s+/)
        .filter((word) => word.length > 0);

      // Combine all words in order
      const allWords = [...firstNameWords, ...lastNameWords];

      // Build username word by word until we hit the 15 character limit
      let currentUsername = '';
      for (const word of allWords) {
        const cleanWord = word.replace(/[^a-z0-9]/g, '');
        const testUsername = currentUsername + cleanWord;

        if (testUsername.length <= 15) {
          currentUsername = testUsername;
        } else {
          // If this is the first word and it's too long, truncate it
          if (currentUsername === '' && cleanWord.length > 15) {
            currentUsername = cleanWord.substring(0, 15);
          }
          break;
        }
      }

      baseUsername = currentUsername;
    } else if (firstName) {
      // Just first name, same logic
      const words = firstName
        .toLowerCase()
        .split(/\s+/)
        .filter((word) => word.length > 0);
      let currentUsername = '';
      for (const word of words) {
        const cleanWord = word.replace(/[^a-z0-9]/g, '');
        const testUsername = currentUsername + cleanWord;

        if (testUsername.length <= 15) {
          currentUsername = testUsername;
        } else {
          // If this is the first word and it's too long, truncate it
          if (currentUsername === '' && cleanWord.length > 15) {
            currentUsername = cleanWord.substring(0, 15);
          }
          break;
        }
      }
      baseUsername = currentUsername;
    } else {
      // Fallback to email prefix
      baseUsername = email
        .split('@')[0]
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .substring(0, 15);
    }

    // Ensure minimum length
    if (baseUsername.length < 3) {
      baseUsername = email
        .split('@')[0]
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .substring(0, 15);
    }

    // Check if username is available
    let finalUsername = baseUsername;
    let counter = 1;

    while (await this.userService.isUsernameExists(finalUsername)) {
      // Add numbers (e.g., mochamadrizky1, mochamadrizky2)
      if (counter <= 99) {
        const suffix = counter.toString();
        const maxBaseLength = 15 - suffix.length;
        const truncatedBase = baseUsername.substring(0, maxBaseLength);
        finalUsername = `${truncatedBase}${suffix}`;
      } else {
        // Add random suffix for very common names
        const randomSuffix = Math.floor(Math.random() * 9999)
          .toString()
          .padStart(4, '0');
        const maxBaseLength = 15 - randomSuffix.length;
        const truncatedBase = baseUsername.substring(0, maxBaseLength);
        finalUsername = `${truncatedBase}${randomSuffix}`;
        break;
      }
      counter++;
    }

    return finalUsername;
  }
}
