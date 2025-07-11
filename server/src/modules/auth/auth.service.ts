import { BadRequestException, Inject, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '../../common/enums/user-role.enum';
import { jwtConfig } from '../../config';
import { UserResponseDto } from '../user/dto/user-response.dto';
import { User } from '../user/entities/user.entity';
import { UserService } from '../user/user.service';
import { ChangePasswordDto, LoginDto, LoginResponseDto, LogoutResponseDto, RegisterDto, TokenResponseDto } from './dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  // Configuration constants
  private static readonly MAX_USERNAME_GENERATION_ATTEMPTS = 100;
  private static readonly MIN_USERNAME_LENGTH = 3;
  private static readonly MAX_USERNAME_LENGTH = 15;
  private static readonly RANDOM_SUFFIX_LENGTH = 4;

  constructor(
    @Inject(jwtConfig.KEY)
    private readonly jwtConfigService: ConfigType<typeof jwtConfig>,
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  // ==================== AUTHENTICATION OPERATIONS ====================

  /**
   * Register a new user account
   * @param registerDto - User registration data
   * @returns Registration success message
   * @throws ConflictException if username or email already exists
   * @throws BadRequestException if registration data is invalid
   */
  async register(registerDto: RegisterDto): Promise<{ message: string }> {
    this.logger.log(`Attempting user registration for username: ${registerDto.username}`);

    try {
      // Create new user
      await this.userService.create({
        username: registerDto.username,
        password: registerDto.password,
        fullName: registerDto.fullName,
        email: registerDto.email || undefined,
        role: UserRole.USER,
      });

      this.logger.log(`Successfully registered user: ${registerDto.username}`);

      return {
        message: 'Registration successful! You can now log in.',
      };
    } catch (error) {
      this.logger.warn(`Failed registration attempt for username ${registerDto.username}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Authenticate user and return login response
   * @param loginDto - User login credentials
   * @returns Login response with user info and tokens
   * @throws UnauthorizedException if credentials are invalid
   */
  async login(loginDto: LoginDto): Promise<LoginResponseDto & { refreshToken: string }> {
    this.logger.debug(`Attempting login for username: ${loginDto.username}`);

    try {
      // Get user with credentials
      const user = await this.userService.getUserWithCredentials(loginDto.username);
      if (!user || !user.password) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // Verify password
      const isPasswordValid = await this.userService.verifyPassword(loginDto.password, user.password);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // Generate authentication tokens
      const tokens = await this.generateAuthTokens(user);

      // Update user activity
      await this.userService.updateLastActive(user.id);

      this.logger.log(`Successful login for user ID: ${user.id}`);

      const response = LoginResponseDto.create(
        UserResponseDto.fromEntity(user),
        tokens.accessToken,
        this.parseExpirationTime(this.jwtConfigService.accessTokenExpires),
      );

      return { ...response, refreshToken: tokens.refreshToken };
    } catch (error) {
      this.logger.warn(`Failed login attempt for username ${loginDto.username}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Handle OAuth login flow
   * @param user - Authenticated OAuth user
   * @returns Login response with user info and tokens
   */
  async oauthLogin(user: User): Promise<LoginResponseDto & { refreshToken: string }> {
    this.logger.log(`OAuth login for user ID: ${user.id}`);

    try {
      // Generate authentication tokens
      const tokens = await this.generateAuthTokens(user);

      // Update user activity
      await this.userService.updateLastActive(user.id);

      const response = LoginResponseDto.create(
        UserResponseDto.fromEntity(user),
        tokens.accessToken,
        this.parseExpirationTime(this.jwtConfigService.accessTokenExpires),
      );

      return { ...response, refreshToken: tokens.refreshToken };
    } catch (error) {
      this.logger.error(`Failed OAuth login for user ID ${user.id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Logout user (placeholder for token invalidation)
   * @param userId - User ID to logout
   * @returns Logout confirmation
   */
  async logout(userId: number): Promise<LogoutResponseDto> {
    this.logger.log(`Logging out user ID: ${userId}`);

    try {
      // Here you would typically:
      // 1. Invalidate refresh tokens in database
      // 2. Add access token to blacklist (if using token blacklisting)
      // 3. Clear any user sessions

      return LogoutResponseDto.create('Successfully logged out');
    } catch (error) {
      this.logger.error(`Failed logout for user ID ${userId}: ${error.message}`);
      throw new BadRequestException('Logout failed. Please try again.');
    }
  }

  // ==================== TOKEN MANAGEMENT ====================

  /**
   * Refresh authentication tokens
   * @param userId - User ID requesting token refresh
   * @returns New token response
   * @throws NotFoundException if user not found
   * @throws UnauthorizedException if user is inactive
   */
  async refreshToken(userId: number): Promise<TokenResponseDto & { refreshToken: string }> {
    this.logger.debug(`Refreshing token for user ID: ${userId}`);

    try {
      const user = await this.userService.getUserEntity(userId);

      // Generate new tokens
      const tokens = await this.generateAuthTokens(user);

      // Update user activity
      await this.userService.updateLastActive(user.id);

      const response = TokenResponseDto.create(
        tokens.accessToken,
        this.parseExpirationTime(this.jwtConfigService.accessTokenExpires),
      );

      return { ...response, refreshToken: tokens.refreshToken };
    } catch (error) {
      this.logger.warn(`Failed token refresh for user ID ${userId}: ${error.message}`);
      throw new UnauthorizedException('Token refresh failed');
    }
  }

  // ==================== PASSWORD MANAGEMENT ====================

  /**
   * Change user password
   * @param userId - User ID
   * @param changePasswordDto - Password change data
   * @throws UnauthorizedException if current password is incorrect
   * @throws NotFoundException if user not found
   */
  async changePassword(userId: number, changePasswordDto: ChangePasswordDto): Promise<{ message: string }> {
    this.logger.log(`Changing password for user ID: ${userId}`);

    try {
      // Get user with current password
      const user = await this.userService.getUserEntity(userId);
      const userWithPassword = await this.userService.getUserWithCredentials(user.username);

      if (!userWithPassword?.password) {
        throw new UnauthorizedException('Unable to verify current password');
      }

      // Verify current password
      const isCurrentPasswordValid = await this.userService.verifyPassword(
        changePasswordDto.currentPassword,
        userWithPassword.password,
      );

      if (!isCurrentPasswordValid) {
        throw new UnauthorizedException('Current password is incorrect');
      }

      // Update with new password
      await this.userService.update(userId, {
        password: changePasswordDto.newPassword,
      });

      this.logger.log(`Successfully changed password for user ID: ${userId}`);
      return { message: 'Password changed successfully' };
    } catch (error) {
      this.logger.warn(`Failed password change for user ID ${userId}: ${error.message}`);
      throw error;
    }
  }

  // ==================== OAUTH OPERATIONS ====================

  /**
   * Validate or create OAuth user
   * @param profile - OAuth profile data
   * @param provider - OAuth provider name
   * @returns User entity
   */
  async validateOAuthUser(profile: any, provider: string): Promise<User> {
    const { email, firstName, lastName, avatarUrl } = profile;

    this.logger.debug(`Processing OAuth login for email: ${email} from provider: ${provider}`);

    try {
      // Check if user already exists
      let user = await this.userService.findUserByEmail(email);

      if (user) {
        // Update existing user with OAuth info if needed
        await this.updateExistingOAuthUser(user, avatarUrl);
        return user;
      }

      // Create new user from OAuth profile
      return await this.createOAuthUser(email, firstName, lastName, avatarUrl, provider);
    } catch (error) {
      this.logger.error(`Failed OAuth validation for email ${email}: ${error.message}`);
      throw error;
    }
  }

  // ==================== PRIVATE HELPER METHODS ====================

  /**
   * Generate JWT access and refresh tokens
   * @param user - User entity
   * @returns Token pair
   */
  private async generateAuthTokens(user: User): Promise<{ accessToken: string; refreshToken: string }> {
    const payload: JwtPayload = {
      sub: user.id,
      username: user.username,
      role: user.role,
    };

    try {
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

      return { accessToken, refreshToken };
    } catch (error) {
      this.logger.error(`Failed to generate tokens for user ${user.id}: ${error.message}`);
      throw new BadRequestException('Failed to generate authentication tokens');
    }
  }

  /**
   * Parse expiration time string to seconds
   * @param expirationTime - Expiration time string (e.g., '1h', '7d')
   * @returns Expiration time in seconds
   */
  private parseExpirationTime(expirationTime: string): number {
    const timeUnit = expirationTime.slice(-1);
    const timeValue = parseInt(expirationTime.slice(0, -1), 10);

    switch (timeUnit) {
      case 's':
        return timeValue;
      case 'm':
        return timeValue * 60;
      case 'h':
        return timeValue * 3600;
      case 'd':
        return timeValue * 86400;
      default:
        return 3600; // Default to 1 hour
    }
  }

  /**
   * Update existing OAuth user with new information
   * @param user - Existing user entity
   * @param avatarUrl - New avatar URL from OAuth provider
   */
  private async updateExistingOAuthUser(user: User, avatarUrl?: string): Promise<void> {
    const updateData: Partial<User> = {};

    // Update avatar if user doesn't have one and OAuth provides one
    if (!user.avatarUrl && avatarUrl) {
      updateData.avatarUrl = avatarUrl;
    }

    // Only update if there are changes
    if (Object.keys(updateData).length > 0) {
      await this.userService.updateUser(user.id, updateData);
      this.logger.debug(`Updated OAuth user ${user.id} with new information`);
    }
  }

  /**
   * Create new user from OAuth profile
   * @param email - User email
   * @param firstName - User first name
   * @param lastName - User last name
   * @param avatarUrl - User avatar URL
   * @param provider - OAuth provider
   * @returns Created user entity
   */
  private async createOAuthUser(
    email: string,
    firstName: string,
    lastName: string,
    avatarUrl: string | undefined,
    provider: string,
  ): Promise<User> {
    const fullName = this.buildFullName(firstName, lastName, email);
    const username = await this.generateUniqueUsername(firstName, lastName, email);

    this.logger.debug(`Creating new OAuth user: ${email} with username: ${username}`);

    return await this.userService.createOAuthUser({
      email,
      fullName,
      avatarUrl,
      provider,
      role: UserRole.USER,
      username,
    });
  }

  /**
   * Build full name from OAuth profile
   * @param firstName - First name
   * @param lastName - Last name
   * @param email - Email as fallback
   * @returns Full name string
   */
  private buildFullName(firstName: string, lastName: string, email: string): string {
    if (firstName && lastName) {
      return `${firstName} ${lastName}`.trim();
    }

    if (firstName) {
      return firstName.trim();
    }

    // Fallback to email prefix
    return email.split('@')[0];
  }

  /**
   * Generate unique username from OAuth profile
   * @param firstName - First name
   * @param lastName - Last name
   * @param email - Email as fallback
   * @returns Unique username
   */
  private async generateUniqueUsername(firstName: string, lastName: string, email: string): Promise<string> {
    const baseUsername = this.buildBaseUsername(firstName, lastName, email);
    return await this.ensureUniqueUsername(baseUsername);
  }

  /**
   * Build base username from name components
   * @param firstName - First name
   * @param lastName - Last name
   * @param email - Email as fallback
   * @returns Base username string
   */
  private buildBaseUsername(firstName: string, lastName: string, email: string): string {
    let baseUsername = '';

    if (firstName && lastName) {
      baseUsername = this.combineNameWords(firstName, lastName);
    } else if (firstName) {
      baseUsername = this.cleanNameWords(firstName);
    } else {
      baseUsername = this.extractEmailPrefix(email);
    }

    // Ensure minimum length
    if (baseUsername.length < AuthService.MIN_USERNAME_LENGTH) {
      baseUsername = this.extractEmailPrefix(email);
    }

    return baseUsername;
  }

  /**
   * Combine and clean name words into username
   * @param firstName - First name
   * @param lastName - Last name
   * @returns Combined username
   */
  private combineNameWords(firstName: string, lastName: string): string {
    const firstNameWords = this.splitAndCleanName(firstName);
    const lastNameWords = this.splitAndCleanName(lastName);
    const allWords = [...firstNameWords, ...lastNameWords];

    return this.buildUsernameFromWords(allWords);
  }

  /**
   * Clean name words into username
   * @param name - Name string
   * @returns Cleaned username
   */
  private cleanNameWords(name: string): string {
    const words = this.splitAndCleanName(name);
    return this.buildUsernameFromWords(words);
  }

  /**
   * Extract and clean email prefix
   * @param email - Email address
   * @returns Cleaned email prefix
   */
  private extractEmailPrefix(email: string): string {
    return email
      .split('@')[0]
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, AuthService.MAX_USERNAME_LENGTH);
  }

  /**
   * Split name into words and clean them
   * @param name - Name string
   * @returns Array of clean words
   */
  private splitAndCleanName(name: string): string[] {
    return name
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 0)
      .map((word) => word.replace(/[^a-z0-9]/g, ''));
  }

  /**
   * Build username from word array within length limits
   * @param words - Array of clean words
   * @returns Username string
   */
  private buildUsernameFromWords(words: string[]): string {
    let currentUsername = '';

    for (const word of words) {
      const testUsername = currentUsername + word;

      if (testUsername.length <= AuthService.MAX_USERNAME_LENGTH) {
        currentUsername = testUsername;
      } else {
        // If this is the first word and it's too long, truncate it
        if (currentUsername === '' && word.length > AuthService.MAX_USERNAME_LENGTH) {
          currentUsername = word.substring(0, AuthService.MAX_USERNAME_LENGTH);
        }
        break;
      }
    }

    return currentUsername;
  }

  /**
   * Ensure username is unique by adding suffix if needed
   * @param baseUsername - Base username
   * @returns Unique username
   * @throws BadRequestException if unable to generate unique username
   */
  private async ensureUniqueUsername(baseUsername: string): Promise<string> {
    let finalUsername = baseUsername;
    let counter = 1;

    while (await this.userService.isUsernameExists(finalUsername)) {
      if (counter > AuthService.MAX_USERNAME_GENERATION_ATTEMPTS) {
        throw new BadRequestException('Unable to generate unique username. Please try again.');
      }

      finalUsername = this.generateUsernameVariant(baseUsername, counter);
      counter++;
    }

    return finalUsername;
  }

  /**
   * Generate username variant with suffix
   * @param baseUsername - Base username
   * @param counter - Attempt counter
   * @returns Username variant
   */
  private generateUsernameVariant(baseUsername: string, counter: number): string {
    if (counter <= 99) {
      // Add sequential numbers (e.g., john1, john2)
      const suffix = counter.toString();
      const maxBaseLength = AuthService.MAX_USERNAME_LENGTH - suffix.length;
      const truncatedBase = baseUsername.substring(0, maxBaseLength);
      return `${truncatedBase}${suffix}`;
    } else {
      // Add random suffix for very common names
      const randomSuffix = Math.floor(Math.random() * Math.pow(10, AuthService.RANDOM_SUFFIX_LENGTH))
        .toString()
        .padStart(AuthService.RANDOM_SUFFIX_LENGTH, '0');
      const maxBaseLength = AuthService.MAX_USERNAME_LENGTH - randomSuffix.length;
      const truncatedBase = baseUsername.substring(0, maxBaseLength);
      return `${truncatedBase}${randomSuffix}`;
    }
  }
}
