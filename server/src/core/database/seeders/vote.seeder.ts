import { DataSource } from 'typeorm';
import { User } from '../../../modules/user/entities/user.entity';
import { Discussion } from '../../../modules/discussion/entities/discussion.entity';
import { Vote, VoteEntityType, VoteValue } from '../../../modules/vote/entities/vote.entity';
import { UserRole } from '../../../common/enums/user-role.enum';

export async function seedVotes(dataSource: DataSource): Promise<void> {
  console.log('👍 Seeding votes...');

  const voteRepository = dataSource.getRepository(Vote);
  const userRepository = dataSource.getRepository(User);
  const discussionRepository = dataSource.getRepository(Discussion);

  // Check if votes already exist
  const voteCount = await voteRepository.count();
  if (voteCount > 0) {
    console.log(`👍 ${voteCount} votes already exist, skipping seeding`);
    return;
  }

  // Get all student users
  const users = await userRepository.find({
    where: { role: UserRole.STUDENT }
  });
  
  if (users.length === 0) {
    console.error('❌ No users found for creating votes');
    return;
  }

  // Get all discussions
  const discussions = await discussionRepository.find();
  if (discussions.length === 0) {
    console.error('❌ No discussions found to vote on');
    return;
  }

  // Create votes array
  const votes: Partial<Vote>[] = [];
  const voteTracker = new Set(); // Track user-entity pairs to avoid duplicates

  // Generate random date between now and a month ago
  const getRandomDate = (): Date => {
    const now = new Date();
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    return new Date(oneMonthAgo.getTime() + Math.random() * (now.getTime() - oneMonthAgo.getTime()));
  };

  // For each discussion, add random votes
  for (const discussion of discussions) {
    // Determine how many votes this discussion will get (random between 0 and total users)
    const maxVotes = Math.floor(Math.random() * users.length);
    
    for (let i = 0; i < maxVotes; i++) {
      // Get random user
      const randomUser = users[Math.floor(Math.random() * users.length)];
      
      // Skip if user is the author of the discussion
      if (randomUser.id === discussion.authorId) {
        continue;
      }
      
      // Skip if this user already voted on this discussion
      const voteKey = `${randomUser.id}-${VoteEntityType.DISCUSSION}-${discussion.id}`;
      if (voteTracker.has(voteKey)) {
        continue;
      }
      
      // Track this vote to avoid duplicates
      voteTracker.add(voteKey);
      
      // Determine vote type (80% chance of upvote, 20% chance of downvote)
      const voteValue = Math.random() < 0.8 ? VoteValue.UPVOTE : VoteValue.DOWNVOTE;
      
      // Create vote
      votes.push({
        entityType: VoteEntityType.DISCUSSION,
        entityId: discussion.id,
        userId: randomUser.id,
        value: voteValue,
        createdAt: getRandomDate(),
        updatedAt: getRandomDate()
      });
    }
  }

  // Save votes to database
  const savedVotes = await voteRepository.save(votes);
  console.log(`👍 Created ${savedVotes.length} votes`);

  // Update upvote and downvote counts in discussions
  for (const discussion of discussions) {
    const discussionVotes = votes.filter(
      v => v.entityType === VoteEntityType.DISCUSSION && v.entityId === discussion.id
    );
    
    const upvotes = discussionVotes.filter(v => v.value === VoteValue.UPVOTE).length;
    const downvotes = discussionVotes.filter(v => v.value === VoteValue.DOWNVOTE).length;
    
    await discussionRepository.update(discussion.id, {
      upvoteCount: upvotes,
      downvoteCount: downvotes
    });
  }
}