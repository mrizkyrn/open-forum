import { DataSource } from 'typeorm';
import { DiscussionSpace } from '../../../modules/discussion/entities/discussion-space.entity';
import { User } from '../../../modules/user/entities/user.entity';

export async function seedDiscussionSpaces(dataSource: DataSource, users: User[]): Promise<void> {
  console.log('🌱 Seeding discussion spaces...');

  const spaceRepository = dataSource.getRepository(DiscussionSpace);

  // Check if spaces already exist
  const spaceCount = await spaceRepository.count();
  if (spaceCount > 0) {
    console.log(`🌐 ${spaceCount} spaces already exist, skipping seeding`);
    return;
  }

  // Get admin and faculty users
  const adminUser = users.find((user) => user.username === 'admin');

  if (!adminUser) {
    console.error('❌ Admin user not found, skipping space seeding');
    return;
  }

  // Create sample spaces
  const spaces = [
    // General spaces (created by admin)
    spaceRepository.create({
      name: 'General',
      description: 'A place for all general discussions about university life.',
      slug: 'general',
      creatorId: adminUser.id,
      followerCount: 0,
    }),
    spaceRepository.create({
      name: 'Academic Support',
      description: 'Get help with your academic questions and challenges.',
      slug: 'academic-support',
      creatorId: adminUser.id,
      followerCount: 0,
    }),
    spaceRepository.create({
      name: 'Campus Events',
      description: 'Discussions about upcoming events and activities on campus.',
      slug: 'campus-events',
      creatorId: adminUser.id,
      followerCount: 0,
    }),
    spaceRepository.create({
      name: 'Clubs & Organizations',
      description: 'Connect with other students in clubs and organizations.',
      slug: 'clubs-organizations',
      creatorId: adminUser.id,
      followerCount: 0,
    }),
    spaceRepository.create({
      name: 'Housing & Accommodation',
      description: 'Find roommates and discuss housing options.',
      slug: 'housing-accommodation',
      creatorId: adminUser.id,
      followerCount: 0,
    }),
    spaceRepository.create({
      name: 'Student Jobs',
      description: 'Find part-time jobs and internships for students.',
      slug: 'student-jobs',
      creatorId: adminUser.id,
      followerCount: 0,
    }),
    spaceRepository.create({
      name: 'Study Abroad',
      description: 'Discuss study abroad opportunities and experiences.',
      slug: 'study-abroad',
      creatorId: adminUser.id,
      followerCount: 0,
    }),
  ];

  // Save spaces
  const savedSpaces = await spaceRepository.save(spaces);
  console.log(`🌐 Created ${savedSpaces.length} discussion spaces`);

  // Add followers to spaces
  for (const space of savedSpaces) {
    // Get random subset of users to follow this space
    const followers = users.sort(() => Math.random() - 0.5).slice(0, Math.floor(Math.random() * users.length) + 1);

    if (followers.length > 0) {
      // Update followerCount
      space.followerCount = followers.length;
      await spaceRepository.save(space);

      // Add followers via direct query to the join table
      for (const follower of followers) {
        await dataSource
          .createQueryBuilder()
          .insert()
          .into('discussion_space_followers')
          .values({ space_id: space.id, user_id: follower.id })
          .execute();
      }

      console.log(`👥 Added ${followers.length} followers to ${space.name}`);
    }
  }
}
