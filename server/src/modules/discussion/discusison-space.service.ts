import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DiscussionSpace } from './entities/discussion-space.entity';
import { FileService } from 'src/core/file/file.service';
import { WebsocketGateway } from 'src/core/websocket/websocket.gateway';
import { CreateDiscussionSpaceDto } from './dto/create-discussion-space.dto';
import { User } from '../user/entities/user.entity';
import { DiscussionSpaceResponseDto } from './dto/discussion-space-response.dto';
import { Pageable } from 'src/common/interfaces/pageable.interface';
import { UpdateDiscussionSpaceDto } from './dto/update-discussion-space.dto';
import { SearchDto } from 'src/common/dto/search.dto';

@Injectable()
export class DiscussionSpaceService {
  constructor(
    @InjectRepository(DiscussionSpace)
    private readonly spaceRepository: Repository<DiscussionSpace>,
    private readonly fileService: FileService,
    private readonly websocketGateway: WebsocketGateway,
  ) {}

  async create(
    createDto: CreateDiscussionSpaceDto,
    currentUser: User,
    files?: { icon?: Express.Multer.File[]; banner?: Express.Multer.File[] },
  ): Promise<DiscussionSpaceResponseDto> {
    // Check if slug already exists
    const existingSpace = await this.spaceRepository.findOne({ where: { slug: createDto.slug } });
    if (existingSpace) {
      throw new ConflictException(`Space with slug "${createDto.slug}" already exists`);
    }

    const queryRunner = this.spaceRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    // Declare savedSpace outside the try block to make it accessible in catch
    let savedSpace: DiscussionSpace;
    let iconUrl: string | null = null;
    let bannerUrl: string | null = null;

    try {
      // Create the space
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
      console.log('savedSpace', savedSpace);

      // Auto-follow created space
      // await this.followSpace(savedSpace.id, currentUser.id);

      await queryRunner.commitTransaction();

      return this.formatSpaceResponse(savedSpace, false);
    } catch (error) {
      console.error(error);
      await queryRunner.rollbackTransaction();

      // Clean up uploaded files in case of error
      if (iconUrl) {
        await this.fileService.deleteFile(iconUrl);
      }

      if (bannerUrl) {
        await this.fileService.deleteFile(bannerUrl);
      }

      if (error instanceof ConflictException) {
        throw error;
      }

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to create discussion space');
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(searchDto: SearchDto, currentUser?: User): Promise<Pageable<DiscussionSpaceResponseDto>> {
    const { page = 1, limit = 10, search } = searchDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.spaceRepository
      .createQueryBuilder('space')
      .leftJoinAndSelect('space.followers', 'follower')
      .skip(skip)
      .take(limit)
      .orderBy('space.updatedAt', 'DESC');

    if (search) {
      queryBuilder.where('space.name ILIKE :search OR space.description ILIKE :search', {
        search: `%${search}%`,
      });
    }

    const [spaces, totalItems] = await queryBuilder.getManyAndCount();

    // Format response and check if current user is following each space
    const formattedSpaces: DiscussionSpaceResponseDto[] = [];

    for (const space of spaces) {
      const isFollowing = currentUser ? space.followers.some((follower) => follower.id === currentUser.id) : false;

      formattedSpaces.push(this.formatSpaceResponse(space, isFollowing));
    }

    const totalPages = Math.ceil(totalItems / limit);

    return {
      items: formattedSpaces,
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

  async findById(id: number, currentUser?: User): Promise<DiscussionSpaceResponseDto> {
    const space = await this.spaceRepository.findOne({
      where: { id },
      relations: ['followers'],
    });

    if (!space) {
      throw new NotFoundException(`Discussion space with ID ${id} not found`);
    }

    const isFollowing = currentUser ? space.followers.some((follower) => follower.id === currentUser.id) : false;

    return this.formatSpaceResponse(space, isFollowing);
  }

  async findBySlug(slug: string, currentUser?: User): Promise<DiscussionSpaceResponseDto> {
    const space = await this.spaceRepository.findOne({
      where: { slug },
      relations: ['followers'],
    });

    if (!space) {
      throw new NotFoundException(`Discussion space with slug "${slug}" not found`);
    }

    const isFollowing = currentUser ? space.followers.some((follower) => follower.id === currentUser.id) : false;

    return this.formatSpaceResponse(space, isFollowing);
  }

  async update(
    id: number,
    updateDto: UpdateDiscussionSpaceDto,
    currentUser: User,
    files?: { icon?: Express.Multer.File[]; banner?: Express.Multer.File[] },
  ): Promise<DiscussionSpaceResponseDto> {
    const space = await this.spaceRepository.findOne({
      where: { id },
      relations: ['followers'],
    });

    if (!space) {
      throw new NotFoundException(`Discussion space with ID ${id} not found`);
    }

    // Check if user is the creator
    if (space.creatorId !== currentUser.id) {
      throw new ForbiddenException('Only the creator can update this space');
    }

    // Check if new slug is already taken by another space
    if (updateDto.slug && updateDto.slug !== space.slug) {
      const existingSpace = await this.spaceRepository.findOne({ where: { slug: updateDto.slug } });
      if (existingSpace && existingSpace.id !== id) {
        throw new ConflictException(`Space with slug "${updateDto.slug}" already exists`);
      }
    }

    const queryRunner = this.spaceRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Update basic fields if provided
      if (updateDto.name) space.name = updateDto.name;
      if (updateDto.description !== undefined) space.description = updateDto.description;
      if (updateDto.slug) space.slug = updateDto.slug;

      // Handle icon upload
      if (files?.icon && files.icon.length > 0) {
        // Delete old icon if exists
        if (space.iconUrl) {
          await this.fileService.deleteFile(space.iconUrl);
        }

        // Upload new icon
        const iconUrl = await this.fileService.uploadSpaceIcon(files.icon[0]);
        space.iconUrl = iconUrl;
      }

      // Handle banner upload - fixed null check
      if (files?.banner && files.banner.length > 0) {
        // Delete old banner if exists
        if (space.bannerUrl) {
          await this.fileService.deleteFile(space.bannerUrl);
        }

        // Upload new banner
        const bannerUrl = await this.fileService.uploadSpaceBanner(files.banner[0]);
        space.bannerUrl = bannerUrl;
      }

      // Save updated space
      await queryRunner.manager.save(space);
      await queryRunner.commitTransaction();

      // Notify clients
      this.websocketGateway.server?.emit('spaceUpdated', { id: space.id });

      // Check if current user is following
      const isFollowing = space.followers.some((follower) => follower.id === currentUser.id);

      return this.formatSpaceResponse(space, isFollowing);
    } catch (error) {
      await queryRunner.rollbackTransaction();

      // Handle specific errors
      if (error instanceof ConflictException || error instanceof ForbiddenException) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to update discussion space');
    } finally {
      await queryRunner.release();
    }
  }

  async delete(id: number, currentUser: User): Promise<void> {
    const space = await this.spaceRepository.findOne({
      where: { id },
      relations: ['discussions'],
    });

    if (!space) {
      throw new NotFoundException(`Discussion space with ID ${id} not found`);
    }

    // Check if user is the creator
    if (space.creatorId !== currentUser.id) {
      throw new ForbiddenException('Only the creator can delete this space');
    }

    // Check if space has discussions
    if (space.discussions?.length > 0) {
      throw new BadRequestException('Cannot delete space with existing discussions');
    }

    const queryRunner = this.spaceRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Delete files if they exist
      if (space.iconUrl) {
        await this.fileService.deleteFile(space.iconUrl);
      }

      if (space.bannerUrl) {
        await this.fileService.deleteFile(space.bannerUrl);
      }

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

      // Notify clients
      this.websocketGateway.server?.emit('spaceDeleted', { id });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException('Failed to delete discussion space');
    } finally {
      await queryRunner.release();
    }
  }

  async followSpace(spaceId: number, userId: number): Promise<void> {
    const space = await this.spaceRepository.findOne({
      where: { id: spaceId },
      relations: ['followers'],
    });

    if (!space) {
      throw new NotFoundException(`Discussion space with ID ${spaceId} not found`);
    }

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

      space.followers.push(user);
      space.followerCount++;

      await queryRunner.manager.save(space);

      await queryRunner.commitTransaction();

      // Notify clients
      // this.websocketGateway.server?.emit('spaceFollowed', {
      //   spaceId,
      //   userId,
      //   followerCount: space.followerCount,
      // });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException('Failed to follow space');
    } finally {
      await queryRunner.release();
    }
  }

  async unfollowSpace(spaceId: number, userId: number): Promise<void> {
    const space = await this.spaceRepository.findOne({
      where: { id: spaceId },
      relations: ['followers'],
    });

    if (!space) {
      throw new NotFoundException(`Discussion space with ID ${spaceId} not found`);
    }

    // Check if already not following
    const followerIndex = space.followers.findIndex((follower) => follower.id === userId);
    if (followerIndex === -1) {
      return; // Not following, no action needed
    }

    const queryRunner = this.spaceRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Update the in-memory followers array by removing the user
      space.followers.splice(followerIndex, 1);

      // Update follower count
      space.followerCount = Math.max(0, space.followerCount - 1);

      // Save the entity with updated followers and count
      await queryRunner.manager.save(space);

      await queryRunner.commitTransaction();

      // Notify clients
      this.websocketGateway.server?.emit('spaceUnfollowed', {
        spaceId,
        userId,
        followerCount: space.followerCount,
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException('Failed to unfollow space');
    } finally {
      await queryRunner.release();
    }
  }

  async isFollowing(spaceId: number, userId: number): Promise<boolean> {
    const count = await this.spaceRepository
      .createQueryBuilder('space')
      .innerJoin('space.followers', 'follower')
      .where('space.id = :spaceId', { spaceId })
      .andWhere('follower.id = :userId', { userId })
      .getCount();

    return count > 0;
  }

  private formatSpaceResponse(space: DiscussionSpace, isFollowing: boolean): DiscussionSpaceResponseDto {
    return {
      id: space.id,
      name: space.name,
      description: space.description,
      slug: space.slug,
      creatorId: space.creatorId,
      iconUrl: space.iconUrl,
      bannerUrl: space.bannerUrl,
      followerCount: space.followerCount,
      isFollowing,
      createdAt: space.createdAt,
      updatedAt: space.updatedAt,
    };
  }
}
