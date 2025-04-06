import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { UserRole } from 'src/common/enums/user-role.enum';
import { Between, Repository, SelectQueryBuilder } from 'typeorm';
import { Pageable } from '../../common/interfaces/pageable.interface';
import { FileService } from '../../core/file/file.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { CreateExternalUserDto } from './dto/create-external-user.dto';
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

  async createAdmin(createAdminDto: CreateAdminDto): Promise<UserResponseDto> {
    const existingUser = await this.userRepository.findOne({
      where: { username: createAdminDto.username },
    });

    if (existingUser) {
      throw new ConflictException('Username already exists');
    }

    const hashedPassword = await this.hashPassword(createAdminDto.password);
    const newUser = this.userRepository.create({
      username: createAdminDto.username,
      password: hashedPassword,
      fullName: createAdminDto.fullName,
      role: UserRole.ADMIN,
      email: createAdminDto.email,
    });

    const savedUser = await this.userRepository.save(newUser);
    return UserResponseDto.fromEntity(savedUser);
  }

  async createExternalUser(userData: CreateExternalUserDto): Promise<User> {
    if (!userData.username) {
      throw new BadRequestException('Username is required');
    }
    let user = await this.userRepository.findOne({
      where: { username: userData.username },
    });

    if (user) {
      Object.assign(user, {
        fullName: userData.fullName,
        gender: userData.gender,
        batchYear: userData.batchYear,
        educationLevel: userData.educationLevel,
        studyProgramId: userData.studyProgramId,
        email: userData.email || user.email,
        phone: userData.phone || user.phone,
      });
    } else {
      user = this.userRepository.create({
        username: userData.username,
        fullName: userData.fullName,
        gender: userData.gender,
        batchYear: userData.batchYear,
        educationLevel: userData.educationLevel,
        studyProgramId: userData.studyProgramId,
        email: userData.email,
        phone: userData.phone,
        role: UserRole.STUDENT,
        password: null,
        isExternalUser: true,
      });
    }

    try {
      return await this.userRepository.save(user);
    } catch (error) {
      this.logger.error(`Failed to create/update user from external data: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to create user from external data');
    }
  }

  async findAll(searchDto: SearchUserDto): Promise<Pageable<UserResponseDto>> {
    const { page, limit } = searchDto;
    const offset = (page - 1) * limit;

    const queryBuilder = this.createUserSearchQuery(searchDto, offset, limit);
    const [users, totalItems] = await queryBuilder.getManyAndCount();

    return this.createPaginatedResponse(users, totalItems, page, limit);
  }

  async findById(id: number): Promise<UserDetailResponseDto> {
    const user = await this.getUserEntity(id, ['studyProgram', 'studyProgram.faculty']);
    return UserDetailResponseDto.fromEntity(user);
  }

  async findByUsername(username: string): Promise<UserDetailResponseDto> {
    const user = await this.userRepository.findOne({
      where: { username },
      relations: ['studyProgram', 'studyProgram.faculty'],
    });

    if (!user) {
      throw new NotFoundException(`User with username ${username} not found`);
    }

    return UserDetailResponseDto.fromEntity(user);
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.getUserEntityById(id);

    if (user.role !== UserRole.ADMIN) {
      throw new BadRequestException('Only admins can be updated');
    }

    if (updateUserDto.fullName) user.fullName = updateUserDto.fullName;
    if (updateUserDto.role !== undefined) user.role = updateUserDto.role;

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
    return this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.username = :username', { username })
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

  private createUserSearchQuery(params: SearchUserDto, offset: number, limit: number): SelectQueryBuilder<User> {
    const { search, role, sortBy, sortOrder } = params;

    let queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .orderBy(`user.${sortBy || 'createdAt'}`, sortOrder || 'DESC')
      .skip(offset)
      .take(limit);

    if (search) {
      queryBuilder = queryBuilder.where('user.username ILIKE :search OR user.fullName ILIKE :search', {
        search: `%${search}%`,
      });
    }

    if (role) {
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
}
