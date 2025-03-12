import * as bcrypt from 'bcrypt';
import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Pageable } from '../../common/interfaces/pageable.interface';
import { CreateUserDto } from './dto/create-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { SearchUserDto } from './dto/search-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { FileService } from '../../core/file/file.service';

@Injectable()
export class UserService {
  private lastUpdateMap = new Map<number, number>();
  private readonly UPDATE_INTERVAL = 5 * 60 * 1000; // 5 minutes

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly fileService: FileService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const existingUser = await this.userRepository.findOne({
      where: { username: createUserDto.username },
    });

    if (existingUser) {
      throw new ConflictException('Username already exists');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const newUser = this.userRepository.create({
      username: createUserDto.username,
      password: hashedPassword,
      fullName: createUserDto.fullName,
      role: createUserDto.role,
    });

    await this.userRepository.save(newUser);

    return this.mapToUserResponseDto(newUser);
  }

  async findAll(searchDto: SearchUserDto): Promise<Pageable<UserResponseDto>> {
    const { page, limit, search, role, sortOrder, sortBy } = searchDto;
    const offset = (page - 1) * limit;

    let queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .orderBy(`user.${sortBy}`, sortOrder)
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

    const [users, totalItems] = await queryBuilder.getManyAndCount();

    const userDtos = users.map((user) => this.mapToUserResponseDto(user));

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

  async findByUsername(username: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { username } });
  }

  async getUserWithPassword(username: string): Promise<User | null> {
    return this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.username = :username', { username })
      .getOne();
  }

  async findById(id: number): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    if (updateUserDto.fullName) {
      user.fullName = updateUserDto.fullName;
    }

    if (updateUserDto.role !== undefined) {
      user.role = updateUserDto.role;
    }

    return this.userRepository.save(user);
  }

  async updateAvatar(userId: number, file: Express.Multer.File): Promise<User> {
    const user = await this.findById(userId);

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    try {
      // Delete old avatar if exists
      if (user.avatarUrl) {
        await this.fileService.deleteFile(user.avatarUrl);
      }

      // Upload new avatar
      const avatarUrl = await this.fileService.uploadUserAvatar(file);

      // Update user record
      user.avatarUrl = avatarUrl;
      await this.userRepository.save(user);

      return user;
    } catch (error) {
      console.error('Error updating avatar:', error);
      throw error;
    }
  }

  async removeAvatar(userId: number): Promise<User> {
    const user = await this.findById(userId);

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Remove avatar file if exists
    if (user.avatarUrl) {
      await this.fileService.deleteFile(user.avatarUrl);
      // user.avatarUrl = null;
      await this.userRepository.save(user);
    }

    return user;
  }

  async delete(id: number): Promise<void> {
    const user = await this.findById(id);

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    await this.userRepository.softDelete(id);
  }

  async verifyPassword(plainTextPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainTextPassword, hashedPassword);
  }
  
  async updateLastActive(userId: number): Promise<void> {
    const now = Date.now();
    const lastUpdate = this.lastUpdateMap.get(userId) || 0;
    
    if (now - lastUpdate > this.UPDATE_INTERVAL) {
      this.lastUpdateMap.set(userId, now);
      try {
        await this.userRepository.update(userId, {
          lastActiveAt: new Date()
        });
      } catch (error) {
        console.error(`Failed to update lastActiveAt for user ${userId}:`, error);
      }
    }
  }

  mapToUserResponseDto(user: User): UserResponseDto {
    return {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
