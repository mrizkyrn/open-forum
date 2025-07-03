import { DataSource } from 'typeorm';
import { seedDiscussionSpaces } from './discussion-space.seeder';
import { seedDiscussions } from './discussion.seeder';
import { seedReportReasons } from './report-reason.seeder';
import { seedUsers } from './user.seeder';
import { seedReports } from './report-seeder';
import { seedVotes } from './vote.seeder';
import { seedComments } from './comment.seeder';

export async function seedDatabase(dataSource: DataSource): Promise<void> {
  console.log('🌱 Starting database seeding...');

  try {
    // Ensure database connection is open
    if (!dataSource.isInitialized) {
      await dataSource.initialize();
    }

    // Seed in sequence to maintain referential integrity
    const users = await seedUsers(dataSource);
    await seedDiscussionSpaces(dataSource, users);
    await seedDiscussions(dataSource);
    await seedComments(dataSource);
    await seedVotes(dataSource);
    await seedReportReasons(dataSource);
    await seedReports(dataSource);

    console.log('✅ Database seeding completed successfully');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}
