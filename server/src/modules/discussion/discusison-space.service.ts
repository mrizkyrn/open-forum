import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pageable } from '../../common/interfaces/pageable.interface';
import { FileService } from '../../core/file/file.service';
import { User } from '../user/entities/user.entity';
import { CreateDiscussionSpaceDto } from './dto/create-discussion-space.dto';
import { DiscussionSpaceResponseDto } from './dto/discussion-space-response.dto';
import { SearchSpaceDto } from './dto/search-space.dto';
import { UpdateDiscussionSpaceDto } from './dto/update-discussion-space.dto';
import { DiscussionSpace } from './entities/discussion-space.entity';

@Injectable()
export class DiscussionSpaceService {
  private readonly logger = new Logger(DiscussionSpaceService.name);

  constructor(
    @InjectRepository(DiscussionSpace)
    private readonly spaceRepository: Repository<DiscussionSpace>,
    private readonly fileService: FileService,
  ) {}

  // ----- Core CRUD Operations -----

  async create(
    createDto: CreateDiscussionSpaceDto,
    currentUser: User,
    files?: { icon?: Express.Multer.File[]; banner?: Express.Multer.File[] },
  ): Promise<DiscussionSpaceResponseDto> {
    const existingSpace = await this.spaceRepository.findOne({ where: { slug: createDto.slug } });
    if (existingSpace) {
      throw new ConflictException(`Space with slug "${createDto.slug}" already exists`);
    }

    const queryRunner = this.spaceRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let savedSpace: DiscussionSpace;
    let iconUrl: string | null = null;
    let bannerUrl: string | null = null;

    try {
      const space = this.spaceRepository.create({
        name: createDto.name,
        description: createDto.description,
        slug: createDto.slug,
        creatorId: currentUser.id,
        followerCount: 0,
      });

      savedSpace = await queryRunner.manager.save(DiscussionSpace, space);

      // Handle icon upload
      if (files?.icon && files.icon.length > 0) {
        iconUrl = await this.fileService.uploadSpaceIcon(files.icon[0]);
        savedSpace.iconUrl = iconUrl;
      }

      // Handle banner upload
      if (files?.banner && files.banner.length > 0) {
        bannerUrl = await this.fileService.uploadSpaceBanner(files.banner[0]);
        savedSpace.bannerUrl = bannerUrl;
      }

      // Save with file URLs
      await queryRunner.manager.save(DiscussionSpace, savedSpace);
      await queryRunner.commitTransaction();

      return DiscussionSpaceResponseDto.fromEntity(savedSpace, false);
    } catch (error) {
      this.logger.error(`Failed to create discussion space: ${error.message}`, error.stack);
      await queryRunner.rollbackTransaction();
      await this.cleanupFiles(iconUrl, bannerUrl);

      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(searchDto: SearchSpaceDto, currentUser?: User): Promise<Pageable<DiscussionSpaceResponseDto>> {
    try {
      const { page, limit } = searchDto;
      const offset = (page - 1) * limit;

      const queryBuilder = this.buildSpaceSearchQuery(searchDto, offset, limit);
      const [spaces, totalItems] = await queryBuilder.getManyAndCount();

      // Format response and check if current user is following each space
      const formattedSpaces = await Promise.all(
        spaces.map(async (space) => {
          let isFollowing = false;

          if (currentUser) {
            if ('is_following' in space) {
              isFollowing = Boolean(space.is_following);
            } else {
              isFollowing = await this.isFollowing(space.id, currentUser.id);
            }
          }

          return DiscussionSpaceResponseDto.fromEntity(space, isFollowing);
        }),
      );

      return this.createPaginatedResponse(formattedSpaces, totalItems, page, limit);
    } catch (error) {
      this.logger.error(`Failed to fetch discussion spaces: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findById(id: number, currentUser?: User): Promise<DiscussionSpaceResponseDto> {
    try {
      const space = await this.getSpaceWithFollowers(id);
      const isFollowing = currentUser ? space.followers.some((follower) => follower.id === currentUser.id) : false;

      return DiscussionSpaceResponseDto.fromEntity(space, isFollowing);
    } catch (error) {
      this.logger.error(`Failed to fetch discussion space: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findBySlug(slug: string, currentUser?: User): Promise<DiscussionSpaceResponseDto> {
    try {
      const space = await this.spaceRepository.findOne({
        where: { slug },
        relations: ['followers'],
      });
      if (!space) {
        throw new NotFoundException(`Discussion space with slug "${slug}" not found`);
      }

      const isFollowing = currentUser ? space.followers.some((follower) => follower.id === currentUser.id) : false;

      return DiscussionSpaceResponseDto.fromEntity(space, isFollowing);
    } catch (error) {
      this.logger.error(`Failed to fetch discussion space by slug: ${error.message}`, error.stack);
      throw error;
    }
  }

  async update(
    id: number,
    updateDto: UpdateDiscussionSpaceDto,
    currentUser: User,
    files?: { icon?: Express.Multer.File[]; banner?: Express.Multer.File[] },
  ): Promise<DiscussionSpaceResponseDto> {
    const space = await this.getSpaceWithFollowers(id);

    this.verifyCreator(space, currentUser.id);
    await this.validateSlugUniqueness(updateDto.slug, space.slug, id);

    const queryRunner = this.spaceRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Update basic fields if provided
      if (updateDto.name) space.name = updateDto.name;
      if (updateDto.description !== undefined) space.description = updateDto.description;
      if (updateDto.slug) space.slug = updateDto.slug;

      // Handle icon update/removal
      if (files?.icon && files.icon.length > 0) {
        await this.updateSpaceImage(space, 'icon', files.icon[0]);
      } else if (updateDto.removeIcon) {
        await this.removeSpaceImage(space, 'icon');
      }

      // Handle banner update/removal
      if (files?.banner && files.banner.length > 0) {
        await this.updateSpaceImage(space, 'banner', files.banner[0]);
      } else if (updateDto.removeBanner) {
        await this.removeSpaceImage(space, 'banner');
      }

      await queryRunner.manager.save(space);
      await queryRunner.commitTransaction();

      // Check if current user is following
      const isFollowing = space.followers.some((follower) => follower.id === currentUser.id);

      return DiscussionSpaceResponseDto.fromEntity(space, isFollowing);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      await this.cleanupFiles(files?.icon?.[0]?.filename, files?.banner?.[0]?.filename);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async delete(id: number, currentUser: User): Promise<void> {
    try {
      const space = await this.spaceRepository.findOne({
        where: { id },
        relations: ['discussions'],
      });
      if (!space) {
        throw new NotFoundException(`Discussion space with ID ${id} not found`);
      }

      this.verifyCreator(space, currentUser.id);

      // Check if space has discussions
      if (space.discussions?.length > 0) {
        throw new BadRequestException('Cannot delete space with existing discussions');
      }

      const queryRunner = this.spaceRepository.manager.connection.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        // Delete files
        await this.cleanupFiles(space.iconUrl, space.bannerUrl);

        // Remove follows relationships
        await queryRunner.manager
          .createQueryBuilder()
          .delete()
          .from('discussion_space_followers')
          .where('space_id = :id', { id })
          .execute();

        // Delete the space
        await queryRunner.manager.remove(space);
        await queryRunner.commitTransaction();
      } catch (error) {
        await queryRunner.rollbackTransaction();
        throw error;
      } finally {
        await queryRunner.release();
      }
    } catch (error) {
      this.logger.error(`Failed to delete discussion space: ${error.message}`, error.stack);
      throw error;
    }
  }

  // ----- Following Operations -----

  async followSpace(spaceId: number, userId: number): Promise<void> {
    try {
      const space = await this.getSpaceWithFollowers(spaceId);

      // Check if already following
      const isFollowing = space.followers.some((follower) => follower.id === userId);
      if (isFollowing) {
        return;
      }

      const queryRunner = this.spaceRepository.manager.connection.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        const user = await queryRunner.manager.findOne(User, { where: { id: userId } });
        if (!user) {
          throw new NotFoundException(`User with ID ${userId} not found`);
        }

        // Update followers and count
        space.followers.push(user);
        space.followerCount++;

        await queryRunner.manager.save(space);
        await queryRunner.commitTransaction();
      } catch (error) {
        await queryRunner.rollbackTransaction();
        throw error;
      } finally {
        await queryRunner.release();
      }
    } catch (error) {
      this.logger.error(`Failed to follow discussion space: ${error.message}`, error.stack);
      throw error;
    }
  }

  async unfollowSpace(spaceId: number, userId: number): Promise<void> {
    const space = await this.getSpaceWithFollowers(spaceId);

    // Check if already not following
    const followerIndex = space.followers.findIndex((follower) => follower.id === userId);
    if (followerIndex === -1) {
      return;
    }

    const queryRunner = this.spaceRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Update followers and count
      space.followers.splice(followerIndex, 1);
      space.followerCount = Math.max(0, space.followerCount - 1);

      await queryRunner.manager.save(space);
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException('Failed to unfollow space');
    } finally {
      await queryRunner.release();
    }
  }

  async isFollowing(spaceId: number, userId: number): Promise<boolean> {
    try {
      const count = await this.spaceRepository
        .createQueryBuilder('space')
        .innerJoin('space.followers', 'follower')
        .where('space.id = :spaceId', { spaceId })
        .andWhere('follower.id = :userId', { userId })
        .getCount();

      return count > 0;
    } catch (error) {
      this.logger.error(`Failed to check following status: ${error.message}`, error.stack);
      throw error;
    }
  }

  // ----- Popular Spaces -----

  async getPopularSpaces(limit: number): Promise<DiscussionSpaceResponseDto[]> {
    try {
      const spaces = await this.spaceRepository
        .createQueryBuilder('space')
        .orderBy('space.followerCount', 'DESC')
        .take(limit)
        .getMany();

      return spaces.map((space) => DiscussionSpaceResponseDto.fromEntity(space, false));
    } catch (error) {
      this.logger.error(`Failed to fetch popular spaces: ${error.message}`, error.stack);
      throw error;
    }
  }

  // ----- Helper Methods -----

  private buildSpaceSearchQuery(searchDto: SearchSpaceDto, offset: number, limit: number, currentUser?: User) {
    const { sortBy = 'createdAt', sortOrder = 'DESC' } = searchDto;

    let queryBuilder = this.spaceRepository
      .createQueryBuilder('space')
      .orderBy(`space.${sortBy}`, sortOrder)
      .skip(offset)
      .take(limit);

    if (searchDto.search) {
      queryBuilder = queryBuilder.where('space.name ILIKE :search OR space.description ILIKE :search', {
        search: `%${searchDto.search}%`,
      });
    }

    if (currentUser) {
      queryBuilder = queryBuilder
        .leftJoin('space.followers', 'currentUserFollowing', 'currentUserFollowing.id = :currentUserId', {
          currentUserId: currentUser.id,
        })
        .addSelect('CASE WHEN currentUserFollowing.id IS NOT NULL THEN true ELSE false END', 'is_following');
    }

    return queryBuilder;
  }

  private async getSpaceWithFollowers(id: number): Promise<DiscussionSpace> {
    const space = await this.spaceRepository.findOne({
      where: { id },
      relations: ['followers'],
    });

    if (!space) {
      throw new NotFoundException(`Discussion space with ID ${id} not found`);
    }

    return space;
  }

  private verifyCreator(space: DiscussionSpace, userId: number): void {
    if (space.creatorId !== userId) {
      throw new ForbiddenException('Only the creator can modify this space');
    }
  }

  private async validateSlugUniqueness(newSlug?: string, currentSlug?: string, spaceId?: number): Promise<void> {
    if (newSlug && newSlug !== currentSlug) {
      const existingSpace = await this.spaceRepository.findOne({ where: { slug: newSlug } });

      if (existingSpace && existingSpace.id !== spaceId) {
        throw new ConflictException(`Space with slug "${newSlug}" already exists`);
      }
    }
  }

  private async updateSpaceImage(
    space: DiscussionSpace,
    type: 'icon' | 'banner',
    file: Express.Multer.File,
  ): Promise<void> {
    // Delete old file if exists
    const currentUrl = type === 'icon' ? space.iconUrl : space.bannerUrl;
    if (currentUrl) {
      await this.fileService.deleteFile(currentUrl);
    }

    // Upload new file
    const newUrl =
      type === 'icon' ? await this.fileService.uploadSpaceIcon(file) : await this.fileService.uploadSpaceBanner(file);

    // Update entity
    if (type === 'icon') {
      space.iconUrl = newUrl;
    } else {
      space.bannerUrl = newUrl;
    }
  }

  private async removeSpaceImage(space: DiscussionSpace, type: 'icon' | 'banner'): Promise<void> {
    // Get current URL
    const currentUrl = type === 'icon' ? space.iconUrl : space.bannerUrl;

    // If URL exists, delete the file
    if (currentUrl) {
      await this.fileService.deleteFile(currentUrl);
    }

    // Update entity field to null
    if (type === 'icon') {
      space.iconUrl = null;
    } else {
      space.bannerUrl = null;
    }
  }

  private async cleanupFiles(iconUrl?: string | null, bannerUrl?: string | null): Promise<void> {
    try {
      if (iconUrl) {
        await this.fileService.deleteFile(iconUrl);
      }

      if (bannerUrl) {
        await this.fileService.deleteFile(bannerUrl);
      }
    } catch (error) {
      this.logger.warn('Error cleaning up files', error);
    }
  }

  private createPaginatedResponse<T>(items: T[], totalItems: number, page: number, limit: number): Pageable<T> {
    const totalPages = Math.ceil(totalItems / limit);

    return {
      items,
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
