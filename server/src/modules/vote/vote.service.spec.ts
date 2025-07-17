import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';

import { AnalyticService } from '../analytic/analytic.service';
import { ActivityEntityType, ActivityType } from '../analytic/entities/user-activity.entity';
import { CommentService } from '../comment/comment.service';
import { Comment } from '../comment/entities/comment.entity';
import { DiscussionService } from '../discussion/discussion.service';
import { Discussion } from '../discussion/entities/discussion.entity';
import { NotificationEntityType, NotificationType } from '../notification/entities/notification.entity';
import { NotificationService } from '../notification/notification.service';
import { VoteCountsResponseDto, VoteDto } from './dto';
import { Vote, VoteEntityType, VoteValue } from './entities/vote.entity';
import { VoteService } from './vote.service';

describe('VoteService', () => {
  let service: VoteService;
  let voteRepository: jest.Mocked<Repository<Vote>>;
  let discussionService: jest.Mocked<DiscussionService>;
  let commentService: jest.Mocked<CommentService>;
  let notificationService: jest.Mocked<NotificationService>;
  let analyticService: jest.Mocked<AnalyticService>;
  let queryBuilder: jest.Mocked<SelectQueryBuilder<Vote>>;
  let queryRunner: any;
  let mockConnection: any;

  // Mock data factory
  const createMockVote = (overrides: Partial<Vote> = {}): Vote => {
    const baseVote = {
      id: 1,
      entityType: VoteEntityType.DISCUSSION,
      entityId: 1,
      value: VoteValue.UPVOTE,
      userId: 1,
      user: {
        id: 1,
        username: 'testuser',
        fullName: 'Test User',
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      isUpvote: jest.fn().mockReturnValue(true),
      isDownvote: jest.fn().mockReturnValue(false),
      isDiscussionVote: jest.fn().mockReturnValue(true),
      isCommentVote: jest.fn().mockReturnValue(false),
      toggleVote: jest.fn(),
      getVoteDescription: jest.fn().mockReturnValue('upvote on discussion 1'),
      isRecentVote: jest.fn().mockReturnValue(true),
      ...overrides,
    };
    return baseVote as unknown as Vote;
  };

  const createMockDiscussion = (overrides: Partial<Discussion> = {}): Discussion => {
    return {
      id: 1,
      title: 'Test Discussion',
      content: 'Test discussion content',
      authorId: 2,
      upvoteCount: 5,
      downvoteCount: 2,
      ...overrides,
    } as Discussion;
  };

  const createMockComment = (overrides: Partial<Comment> = {}): Comment => {
    return {
      id: 1,
      content: 'Test comment content',
      authorId: 2,
      discussionId: 1,
      upvoteCount: 3,
      downvoteCount: 1,
      ...overrides,
    } as Comment;
  };

  const mockVote = createMockVote();
  const mockDiscussion = createMockDiscussion();
  const mockComment = createMockComment();

  beforeEach(async () => {
    // Create mock query runner
    queryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        findOne: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
        remove: jest.fn(),
      },
    };

    // Create mock connection
    mockConnection = {
      createQueryRunner: jest.fn().mockReturnValue(queryRunner),
    };

    // Create mock query builder
    queryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
      getMany: jest.fn(),
      getManyAndCount: jest.fn(),
      getCount: jest.fn(),
      getRawMany: jest.fn(),
    } as any;

    // Create mock repository
    const mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      manager: {
        connection: mockConnection,
      },
    };

    // Create mock services
    const mockDiscussionService = {
      getDiscussionEntity: jest.fn(),
      incrementUpvoteCount: jest.fn(),
      decrementUpvoteCount: jest.fn(),
      incrementDownvoteCount: jest.fn(),
      decrementDownvoteCount: jest.fn(),
    };

    const mockCommentService = {
      getCommentEntity: jest.fn(),
      incrementUpvoteCount: jest.fn(),
      decrementUpvoteCount: jest.fn(),
      incrementDownvoteCount: jest.fn(),
      decrementDownvoteCount: jest.fn(),
    };

    const mockNotificationService = {
      createNotificationIfNotExists: jest.fn(),
    };

    const mockAnalyticService = {
      recordActivity: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VoteService,
        {
          provide: getRepositoryToken(Vote),
          useValue: mockRepository,
        },
        {
          provide: DiscussionService,
          useValue: mockDiscussionService,
        },
        {
          provide: CommentService,
          useValue: mockCommentService,
        },
        {
          provide: NotificationService,
          useValue: mockNotificationService,
        },
        {
          provide: AnalyticService,
          useValue: mockAnalyticService,
        },
      ],
    }).compile();

    service = module.get<VoteService>(VoteService);
    voteRepository = module.get(getRepositoryToken(Vote));
    discussionService = module.get(DiscussionService);
    commentService = module.get(CommentService);
    notificationService = module.get(NotificationService);
    analyticService = module.get(AnalyticService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Core Vote Operations', () => {
    describe('voteDiscussion', () => {
      const voteDto: VoteDto = { value: VoteValue.UPVOTE };

      beforeEach(() => {
        discussionService.getDiscussionEntity.mockResolvedValue(mockDiscussion);
        mockConnection.createQueryRunner.mockReturnValue(queryRunner);
      });

      it('should create a new upvote on discussion successfully', async () => {
        queryRunner.manager.findOne.mockResolvedValue(null); // No existing vote
        queryRunner.manager.create.mockReturnValue(mockVote);
        queryRunner.manager.save.mockResolvedValue(mockVote);

        const result = await service.voteDiscussion(1, 1, voteDto);

        expect(discussionService.getDiscussionEntity).toHaveBeenCalledWith(1);
        expect(queryRunner.connect).toHaveBeenCalled();
        expect(queryRunner.startTransaction).toHaveBeenCalled();
        expect(queryRunner.manager.findOne).toHaveBeenCalledWith(Vote, {
          where: { userId: 1, entityType: VoteEntityType.DISCUSSION, entityId: 1 },
          relations: ['user'],
        });
        expect(queryRunner.manager.create).toHaveBeenCalledWith(Vote, {
          userId: 1,
          entityType: VoteEntityType.DISCUSSION,
          entityId: 1,
          value: VoteValue.UPVOTE,
        });
        expect(discussionService.incrementUpvoteCount).toHaveBeenCalledWith(1, queryRunner.manager);
        expect(queryRunner.commitTransaction).toHaveBeenCalled();
        expect(queryRunner.release).toHaveBeenCalled();
        expect(result).toBeDefined();
      });

      it('should toggle vote if same vote exists', async () => {
        const existingVote = createMockVote({ value: VoteValue.UPVOTE });
        queryRunner.manager.findOne.mockResolvedValue(existingVote);

        const result = await service.voteDiscussion(1, 1, voteDto);

        expect(queryRunner.manager.remove).toHaveBeenCalledWith(existingVote);
        expect(discussionService.decrementUpvoteCount).toHaveBeenCalledWith(1, queryRunner.manager);
        expect(result).toBeNull();
      });

      it('should change vote direction if different vote exists', async () => {
        const existingVote = createMockVote({ value: VoteValue.DOWNVOTE });
        queryRunner.manager.findOne.mockResolvedValue(existingVote);
        queryRunner.manager.save.mockResolvedValue(existingVote);

        const result = await service.voteDiscussion(1, 1, voteDto);

        expect(existingVote.value).toBe(VoteValue.UPVOTE);
        expect(queryRunner.manager.save).toHaveBeenCalledWith(Vote, existingVote);
        expect(discussionService.incrementUpvoteCount).toHaveBeenCalledWith(1, queryRunner.manager);
        expect(discussionService.decrementDownvoteCount).toHaveBeenCalledWith(1, queryRunner.manager);
        expect(result).toBeDefined();
      });

      it('should send notification for upvote to different user', async () => {
        const discussion = createMockDiscussion({ authorId: 2 }); // Different from voter
        discussionService.getDiscussionEntity.mockResolvedValue(discussion);
        queryRunner.manager.findOne.mockResolvedValue(null);
        queryRunner.manager.create.mockReturnValue(mockVote);
        queryRunner.manager.save.mockResolvedValue(mockVote);

        await service.voteDiscussion(1, 1, voteDto);

        expect(notificationService.createNotificationIfNotExists).toHaveBeenCalledWith(
          {
            recipientId: 2,
            actorId: 1,
            type: NotificationType.DISCUSSION_UPVOTE,
            entityType: NotificationEntityType.DISCUSSION,
            entityId: 1,
            data: expect.objectContaining({
              discussionId: 1,
              url: '/discussions/1',
            }),
          },
          3600, // 1 hour in seconds
        );
      });

      it('should not send notification for self-vote', async () => {
        const discussion = createMockDiscussion({ authorId: 1 }); // Same as voter
        discussionService.getDiscussionEntity.mockResolvedValue(discussion);
        queryRunner.manager.findOne.mockResolvedValue(null);
        queryRunner.manager.create.mockReturnValue(mockVote);
        queryRunner.manager.save.mockResolvedValue(mockVote);

        await service.voteDiscussion(1, 1, voteDto);

        expect(notificationService.createNotificationIfNotExists).not.toHaveBeenCalled();
      });

      it('should throw BadRequestException for invalid vote data', async () => {
        await expect(service.voteDiscussion(1, 1, null as any)).rejects.toThrow(BadRequestException);
      });

      it('should throw BadRequestException for invalid vote value', async () => {
        const invalidVoteDto = { value: 5 as any };

        await expect(service.voteDiscussion(1, 1, invalidVoteDto)).rejects.toThrow(BadRequestException);
      });

      it('should handle vote cooldown', async () => {
        // First vote
        queryRunner.manager.findOne.mockResolvedValue(null);
        queryRunner.manager.create.mockReturnValue(mockVote);
        queryRunner.manager.save.mockResolvedValue(mockVote);

        await service.voteDiscussion(1, 1, voteDto);

        // Immediate second vote should be blocked
        await expect(service.voteDiscussion(1, 1, voteDto)).rejects.toThrow(BadRequestException);
      });

      it('should rollback transaction on error', async () => {
        discussionService.getDiscussionEntity.mockRejectedValue(new Error('Database error'));

        await expect(service.voteDiscussion(1, 1, voteDto)).rejects.toThrow();

        expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
        expect(queryRunner.release).toHaveBeenCalled();
      });
    });

    describe('voteComment', () => {
      const voteDto: VoteDto = { value: VoteValue.DOWNVOTE };

      beforeEach(() => {
        commentService.getCommentEntity.mockResolvedValue(mockComment);
        mockConnection.createQueryRunner.mockReturnValue(queryRunner);
      });

      it('should create a new downvote on comment successfully', async () => {
        queryRunner.manager.findOne.mockResolvedValue(null);
        const downvoteVote = createMockVote({
          value: VoteValue.DOWNVOTE,
          entityType: VoteEntityType.COMMENT,
          entityId: 1,
        });
        queryRunner.manager.create.mockReturnValue(downvoteVote);
        queryRunner.manager.save.mockResolvedValue(downvoteVote);

        const result = await service.voteComment(1, 1, voteDto);

        expect(commentService.getCommentEntity).toHaveBeenCalledWith(1);
        expect(queryRunner.manager.create).toHaveBeenCalledWith(Vote, {
          userId: 1,
          entityType: VoteEntityType.COMMENT,
          entityId: 1,
          value: VoteValue.DOWNVOTE,
        });
        expect(commentService.incrementDownvoteCount).toHaveBeenCalledWith(1, queryRunner.manager);
        expect(result).toBeDefined();
      });

      it('should send notification for comment upvote', async () => {
        const upvoteDto: VoteDto = { value: VoteValue.UPVOTE };
        const comment = createMockComment({ authorId: 2, discussionId: 1 });
        commentService.getCommentEntity.mockResolvedValue(comment);
        queryRunner.manager.findOne.mockResolvedValue(null);
        const upvoteVote = createMockVote({ value: VoteValue.UPVOTE });
        queryRunner.manager.create.mockReturnValue(upvoteVote);
        queryRunner.manager.save.mockResolvedValue(upvoteVote);

        await service.voteComment(1, 1, upvoteDto);

        expect(notificationService.createNotificationIfNotExists).toHaveBeenCalledWith(
          {
            recipientId: 2,
            actorId: 1,
            type: NotificationType.COMMENT_UPVOTE,
            entityType: NotificationEntityType.COMMENT,
            entityId: 1,
            data: expect.objectContaining({
              commentId: 1,
              discussionId: 1,
              url: '/discussions/1?comment=1',
            }),
          },
          3600,
        );
      });
    });

    describe('getUserVoteStatus', () => {
      it('should return vote value if user has voted', async () => {
        discussionService.getDiscussionEntity.mockResolvedValue(mockDiscussion);
        voteRepository.findOne.mockResolvedValue(mockVote);

        const result = await service.getUserVoteStatus(1, VoteEntityType.DISCUSSION, 1);

        expect(discussionService.getDiscussionEntity).toHaveBeenCalledWith(1);
        expect(voteRepository.findOne).toHaveBeenCalledWith({
          where: {
            userId: 1,
            entityType: VoteEntityType.DISCUSSION,
            entityId: 1,
          },
        });
        expect(result).toBe(VoteValue.UPVOTE);
      });

      it('should return null if user has not voted', async () => {
        discussionService.getDiscussionEntity.mockResolvedValue(mockDiscussion);
        voteRepository.findOne.mockResolvedValue(null);

        const result = await service.getUserVoteStatus(1, VoteEntityType.DISCUSSION, 1);

        expect(result).toBeNull();
      });

      it('should throw NotFoundException if entity does not exist', async () => {
        discussionService.getDiscussionEntity.mockRejectedValue(new NotFoundException('Discussion not found'));

        await expect(service.getUserVoteStatus(1, VoteEntityType.DISCUSSION, 999)).rejects.toThrow(NotFoundException);
      });
    });

    describe('getVoteCounts', () => {
      it('should return vote counts for discussion', async () => {
        const discussion = createMockDiscussion({ upvoteCount: 10, downvoteCount: 3 });
        discussionService.getDiscussionEntity.mockResolvedValue(discussion);

        const result = await service.getVoteCounts(VoteEntityType.DISCUSSION, 1);

        expect(result).toBeInstanceOf(VoteCountsResponseDto);
        expect(discussionService.getDiscussionEntity).toHaveBeenCalledWith(1);
      });

      it('should return vote counts for comment', async () => {
        const comment = createMockComment({ upvoteCount: 5, downvoteCount: 1 });
        commentService.getCommentEntity.mockResolvedValue(comment);

        const result = await service.getVoteCounts(VoteEntityType.COMMENT, 1);

        expect(result).toBeInstanceOf(VoteCountsResponseDto);
        expect(commentService.getCommentEntity).toHaveBeenCalledWith(1);
      });

      it('should handle missing vote counts', async () => {
        const discussion = createMockDiscussion({ upvoteCount: undefined, downvoteCount: undefined });
        discussionService.getDiscussionEntity.mockResolvedValue(discussion);

        const result = await service.getVoteCounts(VoteEntityType.DISCUSSION, 1);

        expect(result).toBeInstanceOf(VoteCountsResponseDto);
      });
    });
  });

  describe('Analytics & Reporting', () => {
    describe('getTotalVoteCount', () => {
      it('should return total vote count', async () => {
        voteRepository.count.mockResolvedValue(150);

        const result = await service.getTotalVoteCount();

        expect(voteRepository.count).toHaveBeenCalled();
        expect(result).toBe(150);
      });
    });

    describe('getVoteCountByDateRange', () => {
      it('should return vote count for date range', async () => {
        const startDate = new Date('2023-01-01');
        const endDate = new Date('2023-12-31');
        voteRepository.count.mockResolvedValue(75);

        const result = await service.getVoteCountByDateRange(startDate, endDate);

        expect(voteRepository.count).toHaveBeenCalledWith({
          where: {
            createdAt: expect.any(Object), // Between clause
          },
        });
        expect(result).toBe(75);
      });
    });

    describe('getTimeSeries', () => {
      it('should return time series data', async () => {
        const startDate = new Date('2023-01-01');
        const endDate = new Date('2023-12-31');
        const mockTimeSeries = [
          { date: '2023-01-01', count: '10' },
          { date: '2023-01-02', count: '8' },
        ];
        queryBuilder.getRawMany.mockResolvedValue(mockTimeSeries);

        const result = await service.getTimeSeries(startDate, endDate);

        expect(queryBuilder.where).toHaveBeenCalledWith('vote.createdAt BETWEEN :startDate AND :endDate', {
          startDate,
          endDate,
        });
        expect(result).toEqual(mockTimeSeries);
      });
    });
  });

  describe('Utility Methods', () => {
    describe('getVoteEntity', () => {
      it('should return vote with relations', async () => {
        const relations = ['user'];
        voteRepository.findOne.mockResolvedValue(mockVote);

        const result = await service.getVoteEntity(1, relations);

        expect(voteRepository.findOne).toHaveBeenCalledWith({
          where: { id: 1 },
          relations,
        });
        expect(result).toEqual(mockVote);
      });

      it('should throw NotFoundException if vote not found', async () => {
        voteRepository.findOne.mockResolvedValue(null);

        await expect(service.getVoteEntity(999)).rejects.toThrow(NotFoundException);
      });
    });
  });

  describe('Private Helper Methods', () => {
    describe('validateVoteDto', () => {
      it('should validate correct vote DTO', () => {
        const validateVoteDto = (service as any).validateVoteDto.bind(service);
        const validDto = { value: VoteValue.UPVOTE };

        expect(() => validateVoteDto(validDto)).not.toThrow();
      });

      it('should throw BadRequestException for null DTO', () => {
        const validateVoteDto = (service as any).validateVoteDto.bind(service);

        expect(() => validateVoteDto(null)).toThrow(BadRequestException);
      });

      it('should throw BadRequestException for invalid vote value', () => {
        const validateVoteDto = (service as any).validateVoteDto.bind(service);
        const invalidDto = { value: 2 };

        expect(() => validateVoteDto(invalidDto)).toThrow(BadRequestException);
      });
    });

    describe('validateEntityExists', () => {
      it('should not throw for existing discussion', async () => {
        const validateEntityExists = (service as any).validateEntityExists.bind(service);
        discussionService.getDiscussionEntity.mockResolvedValue(mockDiscussion);

        await expect(validateEntityExists(VoteEntityType.DISCUSSION, 1)).resolves.toBeUndefined();
      });

      it('should not throw for existing comment', async () => {
        const validateEntityExists = (service as any).validateEntityExists.bind(service);
        commentService.getCommentEntity.mockResolvedValue(mockComment);

        await expect(validateEntityExists(VoteEntityType.COMMENT, 1)).resolves.toBeUndefined();
      });

      it('should throw NotFoundException for non-existing entity', async () => {
        const validateEntityExists = (service as any).validateEntityExists.bind(service);
        discussionService.getDiscussionEntity.mockRejectedValue(new NotFoundException('Discussion not found'));

        await expect(validateEntityExists(VoteEntityType.DISCUSSION, 999)).rejects.toThrow(NotFoundException);
      });
    });

    describe('getEntityService', () => {
      it('should return discussion service for discussion entity type', () => {
        const getEntityService = (service as any).getEntityService.bind(service);

        const result = getEntityService(VoteEntityType.DISCUSSION);

        expect(result).toBe(discussionService);
      });

      it('should return comment service for comment entity type', () => {
        const getEntityService = (service as any).getEntityService.bind(service);

        const result = getEntityService(VoteEntityType.COMMENT);

        expect(result).toBe(commentService);
      });
    });

    describe('recordVoteAnalytics', () => {
      it('should record analytics for discussion vote', async () => {
        const recordVoteAnalytics = (service as any).recordVoteAnalytics.bind(service);

        await recordVoteAnalytics(1, VoteEntityType.DISCUSSION, 1, 'added', VoteValue.UPVOTE);

        expect(analyticService.recordActivity).toHaveBeenCalledWith(
          1,
          ActivityType.VOTE_DISCUSSION,
          ActivityEntityType.DISCUSSION,
          1,
          {
            voteValue: VoteValue.UPVOTE,
            discussionId: 1,
            action: 'added',
          },
        );
      });

      it('should record analytics for comment vote', async () => {
        const recordVoteAnalytics = (service as any).recordVoteAnalytics.bind(service);
        commentService.getCommentEntity.mockResolvedValue(mockComment);

        await recordVoteAnalytics(1, VoteEntityType.COMMENT, 1, 'added', VoteValue.DOWNVOTE);

        expect(commentService.getCommentEntity).toHaveBeenCalledWith(1);
        expect(analyticService.recordActivity).toHaveBeenCalledWith(
          1,
          ActivityType.VOTE_COMMENT,
          ActivityEntityType.COMMENT,
          1,
          {
            voteValue: VoteValue.DOWNVOTE,
            discussionId: 1, // From comment.discussionId
            action: 'added',
          },
        );
      });

      it('should handle analytics recording errors gracefully', async () => {
        const recordVoteAnalytics = (service as any).recordVoteAnalytics.bind(service);
        analyticService.recordActivity.mockRejectedValue(new Error('Analytics error'));

        // Should not throw
        await expect(
          recordVoteAnalytics(1, VoteEntityType.DISCUSSION, 1, 'added', VoteValue.UPVOTE),
        ).resolves.toBeUndefined();
      });
    });

    describe('truncateContent', () => {
      it('should truncate long content', () => {
        const truncateContent = (service as any).truncateContent.bind(service);
        const longContent = 'a'.repeat(100);

        const result = truncateContent(longContent, 50);

        expect(result).toBe('a'.repeat(50) + '...');
      });

      it('should not truncate short content', () => {
        const truncateContent = (service as any).truncateContent.bind(service);
        const shortContent = 'Short content';

        const result = truncateContent(shortContent, 50);

        expect(result).toBe('Short content');
      });

      it('should handle empty content', () => {
        const truncateContent = (service as any).truncateContent.bind(service);

        const result = truncateContent('');

        expect(result).toBe('');
      });

      it('should handle null content', () => {
        const truncateContent = (service as any).truncateContent.bind(service);

        const result = truncateContent(null);

        expect(result).toBe('');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle repository errors in vote operations', async () => {
      const voteDto: VoteDto = { value: VoteValue.UPVOTE };
      discussionService.getDiscussionEntity.mockResolvedValue(mockDiscussion);
      mockConnection.createQueryRunner.mockReturnValue(queryRunner);
      queryRunner.manager.findOne.mockRejectedValue(new Error('Database connection failed'));

      await expect(service.voteDiscussion(1, 1, voteDto)).rejects.toThrow();
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });

    it('should handle notification service errors gracefully', async () => {
      const voteDto: VoteDto = { value: VoteValue.UPVOTE };
      const discussion = createMockDiscussion({ authorId: 2 });
      discussionService.getDiscussionEntity.mockResolvedValue(discussion);
      mockConnection.createQueryRunner.mockReturnValue(queryRunner);
      queryRunner.manager.findOne.mockResolvedValue(null);
      queryRunner.manager.create.mockReturnValue(mockVote);
      queryRunner.manager.save.mockResolvedValue(mockVote);
      notificationService.createNotificationIfNotExists.mockRejectedValue(new Error('Notification error'));

      // Should still complete successfully even if notification fails
      const result = await service.voteDiscussion(1, 1, voteDto);

      expect(result).toBeDefined();
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
    });
  });

  describe('Cache Management', () => {
    it('should cleanup vote cache when it gets too large', async () => {
      const checkVoteCooldown = (service as any).checkVoteCooldown.bind(service);

      // Fill cache beyond limit
      const cache = (service as any).recentVoteCache;
      for (let i = 0; i < 1001; i++) {
        cache.set(`user-${i}-discussion-1`, Date.now());
      }

      await checkVoteCooldown(1002, VoteEntityType.DISCUSSION, 1);

      // Cache should be cleaned up
      expect(cache.size).toBeLessThan(1000);
    });
  });
});
