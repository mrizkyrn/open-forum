import 'dotenv/config';
import dataSource from './core/database/data-source';
import { seedDatabase } from './core/database/seeders';

async function runSeed() {
  try {
    await seedDatabase(dataSource);
    process.exit(0);
  } catch (error) {
    console.error('Failed to seed database:', error);
    process.exit(1);
  }
}

runSeed();