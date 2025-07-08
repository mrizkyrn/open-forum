import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { UserRole } from 'src/common/enums/user-role.enum';
import { Between, Repository, SelectQueryBuilder } from 'typeorm';
import { Pageable } from '../../common/interfaces/pageable.interface';
import { FileService } from '../../core/file/file.service';
import { CreateUserDto } from './dto/create-user.dto';
import { SearchUserDto } from './dto/search-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserDetailResponseDto, UserResponseDto } from './dto/user-response.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  private readonly UPDATE_INTERVAL = 5 * 60 * 1000; // 5 minutes
  private lastUpdateMap = new Map<number, number>();

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly fileService: FileService,
  ) {}

  // ----- Core CRUD Operations -----

  async create(createUserDto: CreateUserDto): Promise<User> {
    const normalizedUsername = createUserDto.username.toLowerCase().trim();

    const existingUser = await this.userRepository.findOne({
      where: { username: normalizedUsername },
    });

    if (existingUser) {
      throw new ConflictException('Username already exists');
    }

    // Check if email already exists (only if email is provided)
    if (createUserDto.email) {
      const existingEmailUser = await this.userRepository.findOne({
        where: { email: createUserDto.email },
      });

      if (existingEmailUser) {
        throw new ConflictException('Email already exists');
      }
    }

    const hashedPassword = await this.hashPassword(createUserDto.password);
    const newUser = this.userRepository.create({
      username: normalizedUsername,
      password: hashedPassword,
      fullName: createUserDto.fullName,
      email: createUserDto.email,
      role: createUserDto.role,
    });

    const savedUser = await this.userRepository.save(newUser);
    return savedUser;
  }

  async findAll(searchDto: SearchUserDto, currentUser?: User): Promise<Pageable<UserResponseDto>> {
    const { page, limit } = searchDto;
    const offset = (page - 1) * limit;

    const queryBuilder = this.createUserSearchQuery(searchDto, offset, limit, currentUser);
    const [users, totalItems] = await queryBuilder.getManyAndCount();

    return this.createPaginatedResponse(users, totalItems, page, limit);
  }

  async findById(id: number): Promise<UserDetailResponseDto> {
    const user = await this.getUserEntity(id);
    return UserDetailResponseDto.fromEntity(user);
  }

  async findByUsername(username: string): Promise<UserDetailResponseDto> {
    const user = await this.userRepository.findOne({
      where: { username },
    });

    if (!user) {
      throw new NotFoundException(`User with username ${username} not found`);
    }

    return UserDetailResponseDto.fromEntity(user);
  }

  async findManyByUsernames(usernames: string[]): Promise<User[]> {
    if (!usernames.length) return [];

    return this.userRepository
      .createQueryBuilder('user')
      .where('user.username IN (:...usernames)', { usernames })
      .getMany();
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.getUserEntityById(id);

    if (updateUserDto.fullName) user.fullName = updateUserDto.fullName;
    if (updateUserDto.role !== undefined) user.role = updateUserDto.role;
    if (updateUserDto.password) {
      const hashedPassword = await this.hashPassword(updateUserDto.password);
      user.password = hashedPassword;
    }

    const updatedUser = await this.userRepository.save(user);
    return UserResponseDto.fromEntity(updatedUser);
  }

  async delete(id: number, currenUserId?: number): Promise<void> {
    if (id === currenUserId) {
      throw new BadRequestException('Cannot delete own account');
    }

    const user = await this.getUserEntityById(id);
    await this.cleanupUserResources(user);
    await this.userRepository.delete(id);
  }

  // ----- Avatar Management -----

  async updateAvatar(userId: number, file: Express.Multer.File): Promise<UserResponseDto> {
    const user = await this.getUserEntityById(userId);

    try {
      await this.removeExistingAvatar(user);
      const avatarUrl = await this.fileService.uploadUserAvatar(file);

      user.avatarUrl = avatarUrl;
      const savedUser = await this.userRepository.save(user);

      return UserResponseDto.fromEntity(savedUser);
    } catch (error) {
      this.logger.error(`Failed to update avatar for user ${userId}`, error);
      throw new BadRequestException('Failed to update avatar');
    }
  }

  async removeAvatar(userId: number): Promise<UserResponseDto> {
    const user = await this.getUserEntityById(userId);

    try {
      await this.removeExistingAvatar(user);

      const savedUser = await this.userRepository.save(user);
      return UserResponseDto.fromEntity(savedUser);
    } catch (error) {
      this.logger.error(`Failed to remove avatar for user ${userId}`, error);
      throw new BadRequestException('Failed to remove avatar');
    }
  }

  // ----- Authentication Related -----

  async getUserWithCredentials(username: string): Promise<User | null> {
    const normalizedUsername = username.toLowerCase().trim();
    return this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.username = :username', { username: normalizedUsername })
      .getOne();
  }

  async verifyPassword(plainTextPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainTextPassword, hashedPassword);
  }

  // ----- User Activity Tracking -----

  async updateLastActive(userId: number): Promise<void> {
    const now = Date.now();
    const lastUpdate = this.lastUpdateMap.get(userId) || 0;

    if (now - lastUpdate > this.UPDATE_INTERVAL) {
      this.lastUpdateMap.set(userId, now);
      try {
        await this.userRepository.update(userId, { lastActiveAt: new Date() });
      } catch (error) {
        this.logger.warn(`Failed to update activity timestamp for user ${userId}`, error);
      }
    }
  }

  // ----- Other Operations -----

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

  async countTotal(): Promise<number> {
    return this.userRepository.count();
  }

  async countByDateRange(start: Date, end: Date): Promise<number> {
    return this.userRepository.count({
      where: { createdAt: Between(start, end) },
    });
  }

  async countActiveSince(date: Date): Promise<number> {
    return this.userRepository.createQueryBuilder('user').where('user.last_active_at >= :date', { date }).getCount();
  }

  async getTimeSeries(start: Date, end: Date): Promise<{ date: string; count: string }[]> {
    return this.userRepository
      .createQueryBuilder('user')
      .select(`DATE(user.created_at)`, 'date')
      .addSelect(`COUNT(user.id)`, 'count')
      .where('user.created_at BETWEEN :start AND :end', {
        start,
        end,
      })
      .groupBy(`DATE(user.created_at)`)
      .orderBy(`DATE(user.created_at)`, 'ASC')
      .getRawMany();
  }

  // ----- Helper Methods -----

  private async getUserEntityById(id: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  private async removeExistingAvatar(user: User): Promise<void> {
    if (user.avatarUrl) {
      try {
        await this.fileService.deleteFile(user.avatarUrl);
      } catch (error) {
        this.logger.warn(`Failed to delete avatar file for user ${user.id}`, error);
      }
      user.avatarUrl = null;
    }
  }

  private async cleanupUserResources(user: User): Promise<void> {
    if (user.avatarUrl) {
      try {
        await this.fileService.deleteFile(user.avatarUrl);
      } catch (error) {
        this.logger.warn(`Failed to delete avatar during account deletion for user ${user.id}`, error);
      }
    }
  }

  private createUserSearchQuery(
    params: SearchUserDto,
    offset: number,
    limit: number,
    currentUser?: User,
  ): SelectQueryBuilder<User> {
    const { search, role, sortBy, sortOrder } = params;
    const isAdmin = currentUser?.role === UserRole.ADMIN;

    let queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .orderBy(`user.${sortBy || 'createdAt'}`, sortOrder || 'DESC')
      .skip(offset)
      .take(limit);

    // Exclude admin users and the current user from results if not an admin
    if (currentUser && !isAdmin) {
      queryBuilder = queryBuilder.andWhere('user.role != :adminRole', { adminRole: UserRole.ADMIN });
      queryBuilder = queryBuilder.andWhere('user.id != :currentUserId', { currentUserId: currentUser.id });
    }

    // Search by name or username
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

  async findUserByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { email },
    });
  }

  async createOAuthUser(userData: {
    email: string;
    fullName: string;
    avatarUrl?: string;
    provider: string;
    role: UserRole;
    username?: string;
  }): Promise<User> {
    const newUser = this.userRepository.create({
      username: userData.username || userData.email.toLowerCase().trim(),
      fullName: userData.fullName,
      email: userData.email.toLowerCase().trim(),
      avatarUrl: userData.avatarUrl,
      oauthProvider: userData.provider,
      role: userData.role,
    });

    return await this.userRepository.save(newUser);
  }

  async updateUser(id: number, updateData: Partial<User>): Promise<User> {
    await this.userRepository.update(id, updateData);
    return await this.getUserEntity(id);
  }

  async isUsernameExists(username: string): Promise<boolean> {
    const normalizedUsername = username.toLowerCase().trim();
    const user = await this.userRepository.findOne({
      where: { username: normalizedUsername },
    });
    return !!user;
  }
}
