import { DataSource } from 'typeorm';
import { seedUsers } from './user.seeder';
import { seedDiscussionSpaces } from './discussion-space.seeder';
import { seedReportReasons } from './report-reason.seeder';

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
    // await seedReportReasons(dataSource);

    console.log('✅ Database seeding completed successfully');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}
