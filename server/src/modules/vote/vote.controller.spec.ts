import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from '../../common/enums/user-role.enum';
import { User } from '../user/entities/user.entity';
import { VoteCountsResponseDto, VoteDto, VoteResponseDto } from './dto';
import { Vote, VoteEntityType, VoteValue } from './entities/vote.entity';
import { VoteController } from './vote.controller';
import { VoteService } from './vote.service';

/**
 * Mock factory for creating User entities
 */
const createMockUser = (overrides: Partial<User> = {}): User => {
  const user = new User();
  user.id = 1;
  user.username = 'testuser';
  user.fullName = 'Test User';
  user.email = 'test@example.com';
  user.role = UserRole.USER;
  user.avatarUrl = null;
  user.lastActiveAt = new Date();
  user.createdAt = new Date();
  user.updatedAt = new Date();
  user.oauthProvider = null;

  return Object.assign(user, overrides);
};

/**
 * Mock factory for creating Vote entities
 */
const createMockVote = (overrides: Partial<Vote> = {}): Vote => {
  const vote = new Vote();
  vote.id = 1;
  vote.value = VoteValue.UPVOTE;
  vote.entityType = VoteEntityType.DISCUSSION;
  vote.entityId = 1;
  vote.userId = 1;
  vote.createdAt = new Date();
  vote.updatedAt = new Date();

  return Object.assign(vote, overrides);
};

/**
 * Mock factory for creating VoteResponseDto
 */
const createMockVoteResponseDto = (overrides: Partial<VoteResponseDto> = {}): VoteResponseDto => {
  const dto = new VoteResponseDto();
  dto.id = 1;
  dto.value = VoteValue.UPVOTE;
  dto.entityType = VoteEntityType.DISCUSSION;
  dto.entityId = 1;
  dto.createdAt = new Date();
  dto.updatedAt = new Date();

  return Object.assign(dto, overrides);
};

/**
 * Mock factory for creating VoteCountsResponseDto
 */
const createMockVoteCountsResponseDto = (overrides: Partial<VoteCountsResponseDto> = {}): VoteCountsResponseDto => {
  const dto = new VoteCountsResponseDto();
  dto.upvotes = 5;
  dto.downvotes = 2;
  dto.totalVotes = 7;

  return Object.assign(dto, overrides);
};

describe('VoteController', () => {
  let controller: VoteController;
  let voteService: jest.Mocked<VoteService>;

  // Test data
  let mockUser: User;
  let mockVote: Vote;
  let mockVoteResponse: VoteResponseDto;
  let mockVoteCountsResponse: VoteCountsResponseDto;
  let mockVoteDto: VoteDto;

  beforeEach(async () => {
    // Create mock VoteService
    const mockVoteService = {
      voteDiscussion: jest.fn(),
      voteComment: jest.fn(),
      getUserVoteStatus: jest.fn(),
      getVoteCounts: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [VoteController],
      providers: [
        {
          provide: VoteService,
          useValue: mockVoteService,
        },
      ],
    }).compile();

    controller = module.get<VoteController>(VoteController);
    voteService = module.get(VoteService);

    // Setup test data
    mockUser = createMockUser();
    mockVote = createMockVote();
    mockVoteResponse = createMockVoteResponseDto();
    mockVoteCountsResponse = createMockVoteCountsResponseDto();

    mockVoteDto = {
      value: VoteValue.UPVOTE,
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Controller Initialization', () => {
    it('should be defined', () => {
      expect(controller).toBeDefined();
    });
  });

  // ==================== DISCUSSION VOTE OPERATIONS ====================

  describe('voteOnDiscussion', () => {
    const discussionId = 1;

    it('should create upvote on discussion successfully', async () => {
      voteService.voteDiscussion.mockResolvedValue(mockVoteResponse);

      const result = await controller.voteOnDiscussion(discussionId, mockVoteDto, mockUser);

      expect(result).toEqual(mockVoteResponse);
      expect(voteService.voteDiscussion).toHaveBeenCalledWith(mockUser.id, discussionId, mockVoteDto);
    });

    it('should create downvote on discussion successfully', async () => {
      const downvoteDto = { value: VoteValue.DOWNVOTE };
      const downvoteResponse = createMockVoteResponseDto({ value: VoteValue.DOWNVOTE });

      voteService.voteDiscussion.mockResolvedValue(downvoteResponse);

      const result = await controller.voteOnDiscussion(discussionId, downvoteDto, mockUser);

      expect(result).toEqual(downvoteResponse);
      expect(voteService.voteDiscussion).toHaveBeenCalledWith(mockUser.id, discussionId, downvoteDto);
    });

    it('should return null when vote is toggled (removed)', async () => {
      voteService.voteDiscussion.mockResolvedValue(null);

      const result = await controller.voteOnDiscussion(discussionId, mockVoteDto, mockUser);

      expect(result).toBeNull();
      expect(voteService.voteDiscussion).toHaveBeenCalledWith(mockUser.id, discussionId, mockVoteDto);
    });

    it('should handle discussion not found error', async () => {
      voteService.voteDiscussion.mockRejectedValue(new NotFoundException('Discussion not found'));

      await expect(controller.voteOnDiscussion(discussionId, mockVoteDto, mockUser)).rejects.toThrow(NotFoundException);

      expect(voteService.voteDiscussion).toHaveBeenCalledWith(mockUser.id, discussionId, mockVoteDto);
    });

    it('should handle invalid vote value error', async () => {
      const invalidVoteDto = { value: 0 as VoteValue };
      voteService.voteDiscussion.mockRejectedValue(new BadRequestException('Invalid vote value'));

      await expect(controller.voteOnDiscussion(discussionId, invalidVoteDto, mockUser)).rejects.toThrow(
        BadRequestException,
      );

      expect(voteService.voteDiscussion).toHaveBeenCalledWith(mockUser.id, discussionId, invalidVoteDto);
    });

    it('should handle vote cooldown error', async () => {
      voteService.voteDiscussion.mockRejectedValue(new BadRequestException('Vote cooldown in effect'));

      await expect(controller.voteOnDiscussion(discussionId, mockVoteDto, mockUser)).rejects.toThrow(
        BadRequestException,
      );

      expect(voteService.voteDiscussion).toHaveBeenCalledWith(mockUser.id, discussionId, mockVoteDto);
    });

    it('should handle different discussion IDs', async () => {
      const differentDiscussionId = 999;
      voteService.voteDiscussion.mockResolvedValue(mockVoteResponse);

      await controller.voteOnDiscussion(differentDiscussionId, mockVoteDto, mockUser);

      expect(voteService.voteDiscussion).toHaveBeenCalledWith(mockUser.id, differentDiscussionId, mockVoteDto);
    });
  });

  describe('getDiscussionVoteCounts', () => {
    const discussionId = 1;

    it('should return vote counts for discussion', async () => {
      voteService.getVoteCounts.mockResolvedValue(mockVoteCountsResponse);

      const result = await controller.getDiscussionVoteCounts(discussionId);

      expect(result).toEqual(mockVoteCountsResponse);
      expect(voteService.getVoteCounts).toHaveBeenCalledWith(VoteEntityType.DISCUSSION, discussionId);
    });

    it('should handle discussion with no votes', async () => {
      const noVotesResponse = createMockVoteCountsResponseDto({
        upvotes: 0,
        downvotes: 0,
        totalVotes: 0,
      });

      voteService.getVoteCounts.mockResolvedValue(noVotesResponse);

      const result = await controller.getDiscussionVoteCounts(discussionId);

      expect(result).toEqual(noVotesResponse);
      expect(result.totalVotes).toBe(0);
    });

    it('should handle discussion not found error', async () => {
      voteService.getVoteCounts.mockRejectedValue(new NotFoundException('Discussion not found'));

      await expect(controller.getDiscussionVoteCounts(discussionId)).rejects.toThrow(NotFoundException);

      expect(voteService.getVoteCounts).toHaveBeenCalledWith(VoteEntityType.DISCUSSION, discussionId);
    });

    it('should handle large vote counts', async () => {
      const largeVotesResponse = createMockVoteCountsResponseDto({
        upvotes: 1000,
        downvotes: 250,
        totalVotes: 1250,
      });

      voteService.getVoteCounts.mockResolvedValue(largeVotesResponse);

      const result = await controller.getDiscussionVoteCounts(discussionId);

      expect(result).toEqual(largeVotesResponse);
      expect(result.totalVotes).toBe(1250);
    });
  });

  describe('getDiscussionVoteStatus', () => {
    const discussionId = 1;

    it('should return upvote status for user', async () => {
      voteService.getUserVoteStatus.mockResolvedValue(VoteValue.UPVOTE);

      const result = await controller.getDiscussionVoteStatus(discussionId, mockUser);

      expect(result).toEqual({ voteValue: VoteValue.UPVOTE });
      expect(voteService.getUserVoteStatus).toHaveBeenCalledWith(mockUser.id, VoteEntityType.DISCUSSION, discussionId);
    });

    it('should return downvote status for user', async () => {
      voteService.getUserVoteStatus.mockResolvedValue(VoteValue.DOWNVOTE);

      const result = await controller.getDiscussionVoteStatus(discussionId, mockUser);

      expect(result).toEqual({ voteValue: VoteValue.DOWNVOTE });
      expect(voteService.getUserVoteStatus).toHaveBeenCalledWith(mockUser.id, VoteEntityType.DISCUSSION, discussionId);
    });

    it('should return null when user has not voted', async () => {
      voteService.getUserVoteStatus.mockResolvedValue(null);

      const result = await controller.getDiscussionVoteStatus(discussionId, mockUser);

      expect(result).toEqual({ voteValue: null });
      expect(voteService.getUserVoteStatus).toHaveBeenCalledWith(mockUser.id, VoteEntityType.DISCUSSION, discussionId);
    });

    it('should handle discussion not found error', async () => {
      voteService.getUserVoteStatus.mockRejectedValue(new NotFoundException('Discussion not found'));

      await expect(controller.getDiscussionVoteStatus(discussionId, mockUser)).rejects.toThrow(NotFoundException);

      expect(voteService.getUserVoteStatus).toHaveBeenCalledWith(mockUser.id, VoteEntityType.DISCUSSION, discussionId);
    });

    it('should handle different users correctly', async () => {
      const differentUser = createMockUser({ id: 2, username: 'otheruser' });
      voteService.getUserVoteStatus.mockResolvedValue(VoteValue.DOWNVOTE);

      const result = await controller.getDiscussionVoteStatus(discussionId, differentUser);

      expect(result).toEqual({ voteValue: VoteValue.DOWNVOTE });
      expect(voteService.getUserVoteStatus).toHaveBeenCalledWith(
        differentUser.id,
        VoteEntityType.DISCUSSION,
        discussionId,
      );
    });
  });

  // ==================== COMMENT VOTE OPERATIONS ====================

  describe('voteOnComment', () => {
    const commentId = 1;

    it('should create upvote on comment successfully', async () => {
      const commentVoteResponse = createMockVoteResponseDto({
        entityType: VoteEntityType.COMMENT,
        entityId: commentId,
      });

      voteService.voteComment.mockResolvedValue(commentVoteResponse);

      const result = await controller.voteOnComment(commentId, mockVoteDto, mockUser);

      expect(result).toEqual(commentVoteResponse);
      expect(voteService.voteComment).toHaveBeenCalledWith(mockUser.id, commentId, mockVoteDto);
    });

    it('should create downvote on comment successfully', async () => {
      const downvoteDto = { value: VoteValue.DOWNVOTE };
      const commentDownvoteResponse = createMockVoteResponseDto({
        value: VoteValue.DOWNVOTE,
        entityType: VoteEntityType.COMMENT,
        entityId: commentId,
      });

      voteService.voteComment.mockResolvedValue(commentDownvoteResponse);

      const result = await controller.voteOnComment(commentId, downvoteDto, mockUser);

      expect(result).toEqual(commentDownvoteResponse);
      expect(voteService.voteComment).toHaveBeenCalledWith(mockUser.id, commentId, downvoteDto);
    });

    it('should return null when comment vote is toggled (removed)', async () => {
      voteService.voteComment.mockResolvedValue(null);

      const result = await controller.voteOnComment(commentId, mockVoteDto, mockUser);

      expect(result).toBeNull();
      expect(voteService.voteComment).toHaveBeenCalledWith(mockUser.id, commentId, mockVoteDto);
    });

    it('should handle comment not found error', async () => {
      voteService.voteComment.mockRejectedValue(new NotFoundException('Comment not found'));

      await expect(controller.voteOnComment(commentId, mockVoteDto, mockUser)).rejects.toThrow(NotFoundException);

      expect(voteService.voteComment).toHaveBeenCalledWith(mockUser.id, commentId, mockVoteDto);
    });

    it('should handle invalid comment vote value error', async () => {
      const invalidVoteDto = { value: 2 as VoteValue };
      voteService.voteComment.mockRejectedValue(new BadRequestException('Invalid vote value'));

      await expect(controller.voteOnComment(commentId, invalidVoteDto, mockUser)).rejects.toThrow(BadRequestException);

      expect(voteService.voteComment).toHaveBeenCalledWith(mockUser.id, commentId, invalidVoteDto);
    });

    it('should handle vote cooldown for comments', async () => {
      voteService.voteComment.mockRejectedValue(new BadRequestException('Vote cooldown in effect'));

      await expect(controller.voteOnComment(commentId, mockVoteDto, mockUser)).rejects.toThrow(BadRequestException);

      expect(voteService.voteComment).toHaveBeenCalledWith(mockUser.id, commentId, mockVoteDto);
    });

    it('should handle different comment IDs', async () => {
      const differentCommentId = 456;
      const commentVoteResponse = createMockVoteResponseDto({
        entityType: VoteEntityType.COMMENT,
        entityId: differentCommentId,
      });

      voteService.voteComment.mockResolvedValue(commentVoteResponse);

      await controller.voteOnComment(differentCommentId, mockVoteDto, mockUser);

      expect(voteService.voteComment).toHaveBeenCalledWith(mockUser.id, differentCommentId, mockVoteDto);
    });
  });

  describe('getCommentVoteCounts', () => {
    const commentId = 1;

    it('should return vote counts for comment', async () => {
      voteService.getVoteCounts.mockResolvedValue(mockVoteCountsResponse);

      const result = await controller.getCommentVoteCounts(commentId);

      expect(result).toEqual(mockVoteCountsResponse);
      expect(voteService.getVoteCounts).toHaveBeenCalledWith(VoteEntityType.COMMENT, commentId);
    });

    it('should handle comment with no votes', async () => {
      const noVotesResponse = createMockVoteCountsResponseDto({
        upvotes: 0,
        downvotes: 0,
        totalVotes: 0,
      });

      voteService.getVoteCounts.mockResolvedValue(noVotesResponse);

      const result = await controller.getCommentVoteCounts(commentId);

      expect(result).toEqual(noVotesResponse);
      expect(result.totalVotes).toBe(0);
    });

    it('should handle comment not found error', async () => {
      voteService.getVoteCounts.mockRejectedValue(new NotFoundException('Comment not found'));

      await expect(controller.getCommentVoteCounts(commentId)).rejects.toThrow(NotFoundException);

      expect(voteService.getVoteCounts).toHaveBeenCalledWith(VoteEntityType.COMMENT, commentId);
    });

    it('should handle heavily downvoted comments', async () => {
      const heavyDownvoteResponse = createMockVoteCountsResponseDto({
        upvotes: 3,
        downvotes: 8,
        totalVotes: 11,
      });

      voteService.getVoteCounts.mockResolvedValue(heavyDownvoteResponse);

      const result = await controller.getCommentVoteCounts(commentId);

      expect(result).toEqual(heavyDownvoteResponse);
      expect(result.downvotes).toBe(8);
    });
  });

  describe('getCommentVoteStatus', () => {
    const commentId = 1;

    it('should return upvote status for user on comment', async () => {
      voteService.getUserVoteStatus.mockResolvedValue(VoteValue.UPVOTE);

      const result = await controller.getCommentVoteStatus(commentId, mockUser);

      expect(result).toEqual({ voteValue: VoteValue.UPVOTE });
      expect(voteService.getUserVoteStatus).toHaveBeenCalledWith(mockUser.id, VoteEntityType.COMMENT, commentId);
    });

    it('should return downvote status for user on comment', async () => {
      voteService.getUserVoteStatus.mockResolvedValue(VoteValue.DOWNVOTE);

      const result = await controller.getCommentVoteStatus(commentId, mockUser);

      expect(result).toEqual({ voteValue: VoteValue.DOWNVOTE });
      expect(voteService.getUserVoteStatus).toHaveBeenCalledWith(mockUser.id, VoteEntityType.COMMENT, commentId);
    });

    it('should return null when user has not voted on comment', async () => {
      voteService.getUserVoteStatus.mockResolvedValue(null);

      const result = await controller.getCommentVoteStatus(commentId, mockUser);

      expect(result).toEqual({ voteValue: null });
      expect(voteService.getUserVoteStatus).toHaveBeenCalledWith(mockUser.id, VoteEntityType.COMMENT, commentId);
    });

    it('should handle comment not found error', async () => {
      voteService.getUserVoteStatus.mockRejectedValue(new NotFoundException('Comment not found'));

      await expect(controller.getCommentVoteStatus(commentId, mockUser)).rejects.toThrow(NotFoundException);

      expect(voteService.getUserVoteStatus).toHaveBeenCalledWith(mockUser.id, VoteEntityType.COMMENT, commentId);
    });

    it('should handle different users correctly for comments', async () => {
      const differentUser = createMockUser({ id: 3, username: 'commentuser' });
      voteService.getUserVoteStatus.mockResolvedValue(VoteValue.UPVOTE);

      const result = await controller.getCommentVoteStatus(commentId, differentUser);

      expect(result).toEqual({ voteValue: VoteValue.UPVOTE });
      expect(voteService.getUserVoteStatus).toHaveBeenCalledWith(differentUser.id, VoteEntityType.COMMENT, commentId);
    });
  });

  // ==================== ERROR HANDLING TESTS ====================

  describe('Error Handling', () => {
    it('should propagate service errors correctly in voteOnDiscussion', async () => {
      const serviceError = new Error('Service unavailable');
      voteService.voteDiscussion.mockRejectedValue(serviceError);

      await expect(controller.voteOnDiscussion(1, mockVoteDto, mockUser)).rejects.toThrow(serviceError);
    });

    it('should propagate service errors correctly in voteOnComment', async () => {
      const serviceError = new Error('Database connection failed');
      voteService.voteComment.mockRejectedValue(serviceError);

      await expect(controller.voteOnComment(1, mockVoteDto, mockUser)).rejects.toThrow(serviceError);
    });

    it('should propagate service errors correctly in getDiscussionVoteCounts', async () => {
      const serviceError = new Error('Vote count calculation failed');
      voteService.getVoteCounts.mockRejectedValue(serviceError);

      await expect(controller.getDiscussionVoteCounts(1)).rejects.toThrow(serviceError);
    });

    it('should propagate service errors correctly in getCommentVoteCounts', async () => {
      const serviceError = new Error('Vote count calculation failed');
      voteService.getVoteCounts.mockRejectedValue(serviceError);

      await expect(controller.getCommentVoteCounts(1)).rejects.toThrow(serviceError);
    });

    it('should propagate service errors correctly in getUserVoteStatus', async () => {
      const serviceError = new Error('Vote status lookup failed');
      voteService.getUserVoteStatus.mockRejectedValue(serviceError);

      await expect(controller.getDiscussionVoteStatus(1, mockUser)).rejects.toThrow(serviceError);
      await expect(controller.getCommentVoteStatus(1, mockUser)).rejects.toThrow(serviceError);
    });
  });

  // ==================== INTEGRATION TESTS ====================

  describe('Integration Tests', () => {
    it('should handle complete discussion voting workflow', async () => {
      const discussionId = 1;

      // Step 1: Check initial vote status (no vote)
      voteService.getUserVoteStatus.mockResolvedValue(null);
      const initialStatus = await controller.getDiscussionVoteStatus(discussionId, mockUser);
      expect(initialStatus.voteValue).toBeNull();

      // Step 2: Cast upvote
      voteService.voteDiscussion.mockResolvedValue(mockVoteResponse);
      const voteResult = await controller.voteOnDiscussion(discussionId, mockVoteDto, mockUser);
      expect(voteResult).toEqual(mockVoteResponse);

      // Step 3: Check vote status after voting (upvote)
      voteService.getUserVoteStatus.mockResolvedValue(VoteValue.UPVOTE);
      const afterVoteStatus = await controller.getDiscussionVoteStatus(discussionId, mockUser);
      expect(afterVoteStatus.voteValue).toBe(VoteValue.UPVOTE);

      // Step 4: Get vote counts
      voteService.getVoteCounts.mockResolvedValue(mockVoteCountsResponse);
      const voteCounts = await controller.getDiscussionVoteCounts(discussionId);
      expect(voteCounts).toEqual(mockVoteCountsResponse);
    });

    it('should handle complete comment voting workflow', async () => {
      const commentId = 1;

      // Step 1: Check initial vote status (no vote)
      voteService.getUserVoteStatus.mockResolvedValue(null);
      const initialStatus = await controller.getCommentVoteStatus(commentId, mockUser);
      expect(initialStatus.voteValue).toBeNull();

      // Step 2: Cast downvote
      const downvoteDto = { value: VoteValue.DOWNVOTE };
      const commentDownvoteResponse = createMockVoteResponseDto({
        value: VoteValue.DOWNVOTE,
        entityType: VoteEntityType.COMMENT,
        entityId: commentId,
      });

      voteService.voteComment.mockResolvedValue(commentDownvoteResponse);
      const voteResult = await controller.voteOnComment(commentId, downvoteDto, mockUser);
      expect(voteResult).toEqual(commentDownvoteResponse);

      // Step 3: Check vote status after voting (downvote)
      voteService.getUserVoteStatus.mockResolvedValue(VoteValue.DOWNVOTE);
      const afterVoteStatus = await controller.getCommentVoteStatus(commentId, mockUser);
      expect(afterVoteStatus.voteValue).toBe(VoteValue.DOWNVOTE);

      // Step 4: Get vote counts
      voteService.getVoteCounts.mockResolvedValue(mockVoteCountsResponse);
      const voteCounts = await controller.getCommentVoteCounts(commentId);
      expect(voteCounts).toEqual(mockVoteCountsResponse);
    });

    it('should handle vote toggle workflow', async () => {
      const discussionId = 1;

      // Step 1: Initial upvote
      voteService.voteDiscussion.mockResolvedValue(mockVoteResponse);
      const firstVote = await controller.voteOnDiscussion(discussionId, mockVoteDto, mockUser);
      expect(firstVote).toEqual(mockVoteResponse);

      // Step 2: Toggle vote (remove vote)
      voteService.voteDiscussion.mockResolvedValue(null);
      const toggledVote = await controller.voteOnDiscussion(discussionId, mockVoteDto, mockUser);
      expect(toggledVote).toBeNull();

      // Step 3: Check vote status after toggle (no vote)
      voteService.getUserVoteStatus.mockResolvedValue(null);
      const finalStatus = await controller.getDiscussionVoteStatus(discussionId, mockUser);
      expect(finalStatus.voteValue).toBeNull();
    });

    it('should handle vote direction change workflow', async () => {
      const discussionId = 1;

      // Step 1: Initial upvote
      voteService.voteDiscussion.mockResolvedValue(mockVoteResponse);
      await controller.voteOnDiscussion(discussionId, mockVoteDto, mockUser);

      // Step 2: Change to downvote
      const downvoteDto = { value: VoteValue.DOWNVOTE };
      const downvoteResponse = createMockVoteResponseDto({ value: VoteValue.DOWNVOTE });

      voteService.voteDiscussion.mockResolvedValue(downvoteResponse);
      const changedVote = await controller.voteOnDiscussion(discussionId, downvoteDto, mockUser);
      expect(changedVote).toEqual(downvoteResponse);

      // Step 3: Check vote status after change (downvote)
      voteService.getUserVoteStatus.mockResolvedValue(VoteValue.DOWNVOTE);
      const finalStatus = await controller.getDiscussionVoteStatus(discussionId, mockUser);
      expect(finalStatus.voteValue).toBe(VoteValue.DOWNVOTE);
    });
  });

  // ==================== EDGE CASES ====================

  describe('Edge Cases', () => {
    it('should handle zero vote counts', async () => {
      const zeroVotesResponse = createMockVoteCountsResponseDto({
        upvotes: 0,
        downvotes: 0,
        totalVotes: 0,
      });

      voteService.getVoteCounts.mockResolvedValue(zeroVotesResponse);

      const result = await controller.getDiscussionVoteCounts(1);

      expect(result).toEqual(zeroVotesResponse);
      expect(result.totalVotes).toBe(0);
      expect(result.upvotes).toBe(0);
    });

    it('should handle large entity IDs', async () => {
      const largeEntityId = 999999999;
      voteService.voteDiscussion.mockResolvedValue(mockVoteResponse);

      await controller.voteOnDiscussion(largeEntityId, mockVoteDto, mockUser);

      expect(voteService.voteDiscussion).toHaveBeenCalledWith(mockUser.id, largeEntityId, mockVoteDto);
    });

    it('should handle rapid successive votes', async () => {
      const discussionId = 1;

      // First vote
      voteService.voteDiscussion.mockResolvedValue(mockVoteResponse);
      await controller.voteOnDiscussion(discussionId, mockVoteDto, mockUser);

      // Second vote (should be handled by cooldown in service)
      voteService.voteDiscussion.mockRejectedValue(new BadRequestException('Vote cooldown in effect'));
      await expect(controller.voteOnDiscussion(discussionId, mockVoteDto, mockUser)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should handle votes on both discussions and comments by same user', async () => {
      const discussionId = 1;
      const commentId = 1;

      // Vote on discussion
      voteService.voteDiscussion.mockResolvedValue(mockVoteResponse);
      const discussionVote = await controller.voteOnDiscussion(discussionId, mockVoteDto, mockUser);
      expect(discussionVote).toEqual(mockVoteResponse);

      // Vote on comment
      const commentVoteResponse = createMockVoteResponseDto({
        entityType: VoteEntityType.COMMENT,
        entityId: commentId,
      });
      voteService.voteComment.mockResolvedValue(commentVoteResponse);
      const commentVote = await controller.voteOnComment(commentId, mockVoteDto, mockUser);
      expect(commentVote).toEqual(commentVoteResponse);
    });
  });

  // ==================== SECURITY TESTS ====================

  describe('Security Tests', () => {
    it('should ensure user can only vote with their own user ID', async () => {
      const discussionId = 1;

      voteService.voteDiscussion.mockResolvedValue(mockVoteResponse);

      await controller.voteOnDiscussion(discussionId, mockVoteDto, mockUser);

      // Verify that the service is called with the current user's ID
      expect(voteService.voteDiscussion).toHaveBeenCalledWith(mockUser.id, discussionId, mockVoteDto);
    });

    it('should ensure user can only check their own vote status', async () => {
      const discussionId = 1;

      voteService.getUserVoteStatus.mockResolvedValue(VoteValue.UPVOTE);

      await controller.getDiscussionVoteStatus(discussionId, mockUser);

      // Verify that the service is called with the current user's ID
      expect(voteService.getUserVoteStatus).toHaveBeenCalledWith(mockUser.id, VoteEntityType.DISCUSSION, discussionId);
    });

    it('should ensure different users have separate vote contexts', async () => {
      const discussionId = 1;
      const user1 = createMockUser({ id: 1, username: 'user1' });
      const user2 = createMockUser({ id: 2, username: 'user2' });

      // User 1 votes
      voteService.voteDiscussion.mockResolvedValue(mockVoteResponse);
      await controller.voteOnDiscussion(discussionId, mockVoteDto, user1);
      expect(voteService.voteDiscussion).toHaveBeenCalledWith(user1.id, discussionId, mockVoteDto);

      // User 2 votes
      await controller.voteOnDiscussion(discussionId, mockVoteDto, user2);
      expect(voteService.voteDiscussion).toHaveBeenCalledWith(user2.id, discussionId, mockVoteDto);
    });

    it('should ensure vote counts are public but vote actions are authenticated', async () => {
      const discussionId = 1;

      // Vote counts should work (no user parameter needed in controller)
      voteService.getVoteCounts.mockResolvedValue(mockVoteCountsResponse);
      const voteCounts = await controller.getDiscussionVoteCounts(discussionId);
      expect(voteCounts).toEqual(mockVoteCountsResponse);

      // Vote status requires user authentication
      voteService.getUserVoteStatus.mockResolvedValue(VoteValue.UPVOTE);
      const voteStatus = await controller.getDiscussionVoteStatus(discussionId, mockUser);
      expect(voteStatus).toEqual({ voteValue: VoteValue.UPVOTE });
    });
  });

  // ==================== VALIDATION TESTS ====================

  describe('Validation Tests', () => {
    it('should handle validation through ParseIntPipe for discussionId', async () => {
      // ParseIntPipe validation is handled by NestJS framework
      // We test that the controller receives the expected numeric values
      voteService.voteDiscussion.mockResolvedValue(mockVoteResponse);

      await controller.voteOnDiscussion(123, mockVoteDto, mockUser);

      expect(voteService.voteDiscussion).toHaveBeenCalledWith(mockUser.id, 123, mockVoteDto);
    });

    it('should handle validation through ParseIntPipe for commentId', async () => {
      const commentVoteResponse = createMockVoteResponseDto({
        entityType: VoteEntityType.COMMENT,
        entityId: 456,
      });

      voteService.voteComment.mockResolvedValue(commentVoteResponse);

      await controller.voteOnComment(456, mockVoteDto, mockUser);

      expect(voteService.voteComment).toHaveBeenCalledWith(mockUser.id, 456, mockVoteDto);
    });

    it('should handle ValidationPipe for vote DTO', async () => {
      // ValidationPipe validation is handled by NestJS framework
      // We test that the controller receives properly validated DTOs
      const validatedVoteDto = { value: VoteValue.DOWNVOTE };

      voteService.voteDiscussion.mockResolvedValue(mockVoteResponse);

      await controller.voteOnDiscussion(1, validatedVoteDto, mockUser);

      expect(voteService.voteDiscussion).toHaveBeenCalledWith(mockUser.id, 1, validatedVoteDto);
    });
  });
});
