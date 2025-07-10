import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import { UserRole } from '../../../common/enums/user-role.enum';
import { User } from '../../../modules/user/entities/user.entity';

export async function seedUsers(dataSource: DataSource): Promise<User[]> {
  console.log('🌱 Seeding users...');

  const userRepository = dataSource.getRepository(User);

  // Check if admin specifically exists
  const adminExists = await userRepository.findOne({ where: { username: 'admin' } });
  if (adminExists) {
    console.log('👥 Admin user already exists from migration, skipping user seeding');
    return [adminExists];
  }

  // Create default password
  const password = await bcrypt.hash('password123', 10);

  // Generate random date between now and a month ago
  const getRandomDate = (): Date => {
    const now = new Date();
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    return new Date(oneMonthAgo.getTime() + Math.random() * (now.getTime() - oneMonthAgo.getTime()));
  };

  // Create sample users
  const users = [
    // Admin
    userRepository.create({
      username: 'admin',
      password,
      fullName: 'Administrator',
      role: UserRole.ADMIN,
      createdAt: getRandomDate(),
    }),
  ];

  // Save users to database
  const savedUsers = await userRepository.save(users);
  console.log(`👥 Created ${savedUsers.length} users`);

  return savedUsers;
}
