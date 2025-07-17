import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Between, Repository, SelectQueryBuilder } from 'typeorm';
import { UserRole } from '../../common/enums/user-role.enum';
import { Pageable } from '../../common/interfaces/pageable.interface';
import { FileService } from '../../core/file/file.service';
import { CreateUserDto, SearchUserDto, UpdateUserDto, UserDetailResponseDto, UserResponseDto } from './dto';
import { User } from './entities/user.entity';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  // Configuration constants
  private static readonly BCRYPT_ROUNDS = 12;
  private static readonly ACTIVITY_UPDATE_INTERVAL = 5 * 60 * 1000; // 5 minutes
  private static readonly MAX_USERNAME_LENGTH = 25;
  private static readonly MAX_EMAIL_LENGTH = 100;

  // In-memory cache for activity updates to reduce database calls
  private readonly lastActivityUpdateMap = new Map<number, number>();

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly fileService: FileService,
  ) {}

  // ==================== CORE CRUD OPERATIONS ====================

  /**
   * Create a new user account
   * @param createUserDto - User creation data
   * @returns Created user entity
   * @throws ConflictException if username or email already exists
   */
  async create(createUserDto: CreateUserDto): Promise<User> {
    this.logger.log(`Creating new user with username: ${createUserDto.username}`);

    await this.validateUserUniqueness(createUserDto.username, createUserDto.email);

    const hashedPassword = await this.hashPassword(createUserDto.password);
    const newUser = this.userRepository.create({
      username: this.normalizeUsername(createUserDto.username),
      password: hashedPassword,
      fullName: createUserDto.fullName.trim(),
      email: createUserDto.email ? this.normalizeEmail(createUserDto.email) : null,
      role: createUserDto.role || UserRole.USER,
    });

    const savedUser = await this.userRepository.save(newUser);
    this.logger.log(`Successfully created user with ID: ${savedUser.id}`);

    return savedUser;
  }

  /**
   * Find all users with pagination and filtering
   * @param searchDto - Search and pagination parameters
   * @param currentUser - Current authenticated user for filtering
   * @returns Paginated list of users
   */
  async findAll(searchDto: SearchUserDto, currentUser?: User): Promise<Pageable<UserResponseDto>> {
    this.logger.debug(`Finding users with search params: ${JSON.stringify(searchDto)}`);

    const { page, limit } = searchDto;
    const offset = (page - 1) * limit;

    const queryBuilder = this.buildUserSearchQuery(searchDto, offset, limit, currentUser);
    const [users, totalItems] = await queryBuilder.getManyAndCount();

    const result = this.createPaginatedResponse(users, totalItems, page, limit);

    this.logger.debug(`Found ${users.length} users out of ${totalItems} total`);
    return result;
  }

  /**
   * Find user by ID and return detailed information
   * @param id - User ID
   * @returns User details
   * @throws NotFoundException if user not found
   */
  async findById(id: number): Promise<UserDetailResponseDto> {
    this.logger.debug(`Finding user by ID: ${id}`);

    const user = await this.getUserEntityById(id);
    return UserDetailResponseDto.fromEntity(user);
  }

  /**
   * Find user by username and return detailed information
   * @param username - Username to search for
   * @returns User details
   * @throws NotFoundException if user not found
   */
  async findByUsername(username: string): Promise<UserDetailResponseDto> {
    this.logger.debug(`Finding user by username: ${username}`);

    const normalizedUsername = this.normalizeUsername(username);
    const user = await this.userRepository.findOne({
      where: { username: normalizedUsername },
    });

    if (!user) {
      throw new NotFoundException(`User with username '${username}' not found`);
    }

    return UserDetailResponseDto.fromEntity(user);
  }

  /**
   * Find multiple users by their usernames
   * @param usernames - Array of usernames to search for
   * @returns Array of user entities
   */
  async findManyByUsernames(usernames: string[]): Promise<User[]> {
    if (!usernames.length) {
      return [];
    }

    const normalizedUsernames = usernames.map((username) => this.normalizeUsername(username));

    return this.userRepository
      .createQueryBuilder('user')
      .where('user.username IN (:...usernames)', { usernames: normalizedUsernames })
      .getMany();
  }

  /**
   * Update user information
   * @param id - User ID to update
   * @param updateUserDto - Updated user data
   * @returns Updated user response
   * @throws NotFoundException if user not found
   * @throws ConflictException if username already exists
   */
  async update(id: number, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    this.logger.log(`Updating user with ID: ${id}`);

    const user = await this.getUserEntityById(id);

    // Validate username uniqueness if updating username
    if (updateUserDto.username && updateUserDto.username !== user.username) {
      await this.validateUsernameUniqueness(updateUserDto.username, id);
      user.username = this.normalizeUsername(updateUserDto.username);
    }

    // Update other fields
    if (updateUserDto.fullName) {
      user.fullName = updateUserDto.fullName.trim();
    }

    if (updateUserDto.role !== undefined) {
      user.role = updateUserDto.role;
    }

    if (updateUserDto.password) {
      user.password = await this.hashPassword(updateUserDto.password);
    }

    const updatedUser = await this.userRepository.save(user);
    this.logger.log(`Successfully updated user with ID: ${id}`);

    return UserResponseDto.fromEntity(updatedUser);
  }

  /**
   * Delete a user account and cleanup associated resources
   * @param id - User ID to delete
   * @param currentUserId - Current user's ID (to prevent self-deletion)
   * @throws BadRequestException if trying to delete own account
   * @throws NotFoundException if user not found
   */
  async delete(id: number, currentUserId?: number): Promise<void> {
    this.logger.log(`Deleting user with ID: ${id}`);

    if (id === currentUserId) {
      throw new BadRequestException('Cannot delete your own account');
    }

    const user = await this.getUserEntityById(id);

    // Cleanup associated resources before deletion
    await this.cleanupUserResources(user);

    // Soft delete (if using soft deletes) or hard delete
    await this.userRepository.remove(user);

    this.logger.log(`Successfully deleted user with ID: ${id}`);
  }

  // ==================== AVATAR MANAGEMENT ====================

  /**
   * Update user avatar
   * @param userId - User ID
   * @param file - Avatar image file
   * @returns Updated user response
   * @throws NotFoundException if user not found
   * @throws BadRequestException if file upload fails
   */
  async updateAvatar(userId: number, file: Express.Multer.File): Promise<UserResponseDto> {
    this.logger.log(`Updating avatar for user ${userId}`);

    const user = await this.getUserEntityById(userId);

    try {
      // Remove existing avatar before uploading new one
      await this.removeExistingAvatar(user);

      // Upload new avatar
      const avatarUrl = await this.fileService.uploadUserAvatar(file);
      user.avatarUrl = avatarUrl;

      const savedUser = await this.userRepository.save(user);
      this.logger.log(`Successfully updated avatar for user ${userId}`);

      return UserResponseDto.fromEntity(savedUser);
    } catch (error) {
      this.logger.error(`Failed to update avatar for user ${userId}`, error);
      throw new BadRequestException('Failed to update avatar. Please try again.');
    }
  }

  /**
   * Remove user avatar
   * @param userId - User ID
   * @returns Updated user response
   * @throws NotFoundException if user not found
   * @throws BadRequestException if avatar removal fails
   */
  async removeAvatar(userId: number): Promise<UserResponseDto> {
    this.logger.log(`Removing avatar for user ${userId}`);

    const user = await this.getUserEntityById(userId);

    try {
      await this.removeExistingAvatar(user);
      const savedUser = await this.userRepository.save(user);

      this.logger.log(`Successfully removed avatar for user ${userId}`);
      return UserResponseDto.fromEntity(savedUser);
    } catch (error) {
      this.logger.error(`Failed to remove avatar for user ${userId}`, error);
      throw new BadRequestException('Failed to remove avatar. Please try again.');
    }
  }

  // ==================== AUTHENTICATION & AUTHORIZATION ====================

  /**
   * Get user with password for authentication
   * @param username - Username to search for
   * @returns User entity with password field
   */
  async getUserWithCredentials(username: string): Promise<User | null> {
    const normalizedUsername = this.normalizeUsername(username);

    return this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.username = :username', { username: normalizedUsername })
      .getOne();
  }

  /**
   * Verify password against hash
   * @param plainTextPassword - Plain text password
   * @param hashedPassword - Hashed password from database
   * @returns True if password matches
   */
  async verifyPassword(plainTextPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainTextPassword, hashedPassword);
  }

  /**
   * Check if username already exists
   * @param username - Username to check
   * @returns True if username exists
   */
  async isUsernameExists(username: string): Promise<boolean> {
    const normalizedUsername = this.normalizeUsername(username);
    const user = await this.userRepository.findOne({
      where: { username: normalizedUsername },
    });
    return !!user;
  }

  /**
   * Find user by email
   * @param email - Email to search for
   * @returns User entity or null
   */
  async findUserByEmail(email: string): Promise<User | null> {
    const normalizedEmail = this.normalizeEmail(email);
    return this.userRepository.findOne({
      where: { email: normalizedEmail },
    });
  }

  /**
   * Create user from OAuth provider
   * @param userData - OAuth user data
   * @returns Created user entity
   */
  async createOAuthUser(userData: {
    email: string;
    fullName: string;
    avatarUrl?: string;
    provider: string;
    role: UserRole;
    username: string;
  }): Promise<User> {
    this.logger.log(`Creating OAuth user from provider: ${userData.provider}`);

    const newUser = this.userRepository.create({
      username: this.normalizeUsername(userData.username),
      fullName: userData.fullName.trim(),
      email: this.normalizeEmail(userData.email),
      avatarUrl: userData.avatarUrl,
      oauthProvider: userData.provider,
      role: userData.role,
    });

    const savedUser = await this.userRepository.save(newUser);
    this.logger.log(`Successfully created OAuth user with ID: ${savedUser.id}`);

    return savedUser;
  }

  // ==================== ACTIVITY TRACKING ====================

  /**
   * Update user's last active timestamp (with throttling)
   * @param userId - User ID to update
   */
  async updateLastActive(userId: number): Promise<void> {
    const now = Date.now();
    const lastUpdate = this.lastActivityUpdateMap.get(userId) || 0;

    // Only update if enough time has passed (throttling)
    if (now - lastUpdate > UserService.ACTIVITY_UPDATE_INTERVAL) {
      this.lastActivityUpdateMap.set(userId, now);

      try {
        await this.userRepository.update(userId, {
          lastActiveAt: new Date(),
        });
        this.logger.debug(`Updated last active timestamp for user ${userId}`);
      } catch (error) {
        this.logger.warn(`Failed to update activity timestamp for user ${userId}`, error);
      }
    }
  }

  // ==================== ANALYTICS & REPORTING ====================

  /**
   * Get total user count
   * @returns Total number of users
   */
  async getTotalUserCount(): Promise<number> {
    return this.userRepository.count();
  }

  /**
   * Get user count within date range
   * @param startDate - Start date
   * @param endDate - End date
   * @returns Number of users created in date range
   */
  async getUserCountByDateRange(startDate: Date, endDate: Date): Promise<number> {
    return this.userRepository.count({
      where: {
        createdAt: Between(startDate, endDate),
      },
    });
  }

  /**
   * Get count of active users since specific date
   * @param since - Date to count active users since
   * @returns Number of active users
   */
  async getActiveUserCount(since: Date): Promise<number> {
    return this.userRepository.createQueryBuilder('user').where('user.lastActiveAt >= :since', { since }).getCount();
  }

  /**
   * Get user registration time series data
   * @param startDate - Start date
   * @param endDate - End date
   * @returns Array of date/count pairs
   */
  async getTimeSeries(startDate: Date, endDate: Date): Promise<{ date: string; count: string }[]> {
    return this.userRepository
      .createQueryBuilder('user')
      .select('DATE(user.createdAt)', 'date')
      .addSelect('COUNT(user.id)', 'count')
      .where('user.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .groupBy('DATE(user.createdAt)')
      .orderBy('DATE(user.createdAt)', 'ASC')
      .getRawMany();
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Get user entity with relations
   * @param id - User ID
   * @param relations - Relations to load
   * @returns User entity
   * @throws NotFoundException if user not found
   */
  async getUserEntity(id: number, relations: string[] = []): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations,
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  /**
   * Update user with partial data
   * @param id - User ID
   * @param updateData - Partial user data
   * @returns Updated user entity
   */
  async updateUser(id: number, updateData: Partial<User>): Promise<User> {
    await this.userRepository.update(id, updateData);
    return this.getUserEntity(id);
  }

  // ==================== PRIVATE HELPER METHODS ====================

  /**
   * Get user entity by ID
   * @param id - User ID
   * @returns User entity
   * @throws NotFoundException if user not found
   */
  private async getUserEntityById(id: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  /**
   * Hash password using bcrypt
   * @param password - Plain text password
   * @returns Hashed password
   */
  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, UserService.BCRYPT_ROUNDS);
  }

  /**
   * Normalize username to lowercase and trim
   * @param username - Raw username
   * @returns Normalized username
   */
  private normalizeUsername(username: string): string {
    const normalized = username.toLowerCase().trim();

    if (normalized.length > UserService.MAX_USERNAME_LENGTH) {
      throw new BadRequestException(`Username must not exceed ${UserService.MAX_USERNAME_LENGTH} characters`);
    }

    return normalized;
  }

  /**
   * Normalize email to lowercase and trim
   * @param email - Raw email
   * @returns Normalized email
   */
  private normalizeEmail(email: string): string {
    const normalized = email.toLowerCase().trim();

    if (normalized.length > UserService.MAX_EMAIL_LENGTH) {
      throw new BadRequestException(`Email must not exceed ${UserService.MAX_EMAIL_LENGTH} characters`);
    }

    return normalized;
  }

  /**
   * Validate username and email uniqueness
   * @param username - Username to validate
   * @param email - Email to validate (optional)
   * @throws ConflictException if username or email already exists
   */
  private async validateUserUniqueness(username: string, email?: string): Promise<void> {
    const normalizedUsername = this.normalizeUsername(username);

    // Check username uniqueness
    const existingUser = await this.userRepository.findOne({
      where: { username: normalizedUsername },
    });

    if (existingUser) {
      throw new ConflictException('Username already exists');
    }

    // Check email uniqueness if provided
    if (email) {
      const normalizedEmail = this.normalizeEmail(email);
      const existingEmailUser = await this.userRepository.findOne({
        where: { email: normalizedEmail },
      });

      if (existingEmailUser) {
        throw new ConflictException('Email already exists');
      }
    }
  }

  /**
   * Validate username uniqueness for updates
   * @param username - Username to validate
   * @param excludeUserId - User ID to exclude from check
   * @throws ConflictException if username already exists
   */
  private async validateUsernameUniqueness(username: string, excludeUserId: number): Promise<void> {
    const normalizedUsername = this.normalizeUsername(username);

    const existingUser = await this.userRepository
      .createQueryBuilder('user')
      .where('user.username = :username', { username: normalizedUsername })
      .andWhere('user.id != :excludeUserId', { excludeUserId })
      .getOne();

    if (existingUser) {
      throw new ConflictException('Username already exists');
    }
  }

  /**
   * Remove existing avatar file
   * @param user - User entity
   */
  private async removeExistingAvatar(user: User): Promise<void> {
    if (user.avatarUrl) {
      try {
        await this.fileService.deleteFile(user.avatarUrl);
        user.avatarUrl = null;
        this.logger.debug(`Removed existing avatar for user ${user.id}`);
      } catch (error) {
        this.logger.warn(`Failed to delete avatar file for user ${user.id}`, error);
      }
    }
  }

  /**
   * Cleanup user resources before deletion
   * @param user - User entity to cleanup
   */
  private async cleanupUserResources(user: User): Promise<void> {
    this.logger.debug(`Cleaning up resources for user ${user.id}`);

    // Remove avatar
    if (user.avatarUrl) {
      try {
        await this.fileService.deleteFile(user.avatarUrl);
        this.logger.debug(`Deleted avatar for user ${user.id}`);
      } catch (error) {
        this.logger.warn(`Failed to delete avatar during cleanup for user ${user.id}`, error);
      }
    }

    // Remove from activity cache
    this.lastActivityUpdateMap.delete(user.id);

    // Additional cleanup can be added here (e.g., user-related files, cache entries)
  }

  /**
   * Build search query for users
   * @param searchDto - Search parameters
   * @param offset - Query offset
   * @param limit - Query limit
   * @param currentUser - Current authenticated user
   * @returns Query builder
   */
  private buildUserSearchQuery(
    searchDto: SearchUserDto,
    offset: number,
    limit: number,
    currentUser?: User,
  ): SelectQueryBuilder<User> {
    const { search, role, sortBy, sortOrder } = searchDto;
    const isAdmin = currentUser?.role === UserRole.ADMIN;

    let queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .orderBy(`user.${sortBy || 'createdAt'}`, sortOrder || 'DESC')
      .skip(offset)
      .take(limit);

    // Security: Non-admin users cannot see admin users or themselves in lists
    if (currentUser && !isAdmin) {
      queryBuilder = queryBuilder
        .andWhere('user.role != :adminRole', { adminRole: UserRole.ADMIN })
        .andWhere('user.id != :currentUserId', { currentUserId: currentUser.id });
    }

    // Search by username or full name
    if (search) {
      queryBuilder = queryBuilder.andWhere('(user.username ILIKE :search OR user.fullName ILIKE :search)', {
        search: `%${search}%`,
      });
    }

    // Filter by role (admin only)
    if (role && isAdmin) {
      queryBuilder = queryBuilder.andWhere('user.role = :role', { role });
    }

    return queryBuilder;
  }

  /**
   * Create paginated response
   * @param users - User entities
   * @param totalItems - Total number of items
   * @param page - Current page
   * @param limit - Items per page
   * @returns Paginated response
   */
  private createPaginatedResponse(
    users: User[],
    totalItems: number,
    page: number,
    limit: number,
  ): Pageable<UserResponseDto> {
    const userDtos = users.map((user) => UserResponseDto.fromEntity(user));
    const totalPages = Math.ceil(totalItems / limit);

    return {
      items: userDtos,
      meta: {
        totalItems,
        itemsPerPage: limit,
        currentPage: page,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }
}
