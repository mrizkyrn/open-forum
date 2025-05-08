import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import { UserRole } from '../../../common/enums/user-role.enum';
import { User } from '../../../modules/user/entities/user.entity';

export async function seedUsers(dataSource: DataSource): Promise<User[]> {
  console.log('🌱 Seeding users...');

  const userRepository = dataSource.getRepository(User);

  // Check if users already exist
  const userCount = await userRepository.count();
  if (userCount > 0) {
    console.log(`👥 ${userCount} users already exist, skipping seeding`);
    return userRepository.find();
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

    // Students
    userRepository.create({
      username: 'spongebob',
      password,
      fullName: 'SpongeBob SquarePants',
      role: UserRole.STUDENT,
      createdAt: getRandomDate(),
    }),
    userRepository.create({
      username: 'patrick',
      password,
      fullName: 'Patrick Star',
      role: UserRole.STUDENT,
      createdAt: getRandomDate(),
    }),
    userRepository.create({
      username: 'sandy',
      password,
      fullName: 'Sandy Cheeks',
      role: UserRole.STUDENT,
      createdAt: getRandomDate(),
    }),
    userRepository.create({
      username: 'squidward',
      password,
      fullName: 'Squidward Tentacles',
      role: UserRole.STUDENT,
      createdAt: getRandomDate(),
    }),
    userRepository.create({
      username: 'plankton',
      password,
      fullName: 'Sheldon J. Plankton',
      role: UserRole.STUDENT,
      createdAt: getRandomDate(),
    }),
    userRepository.create({
      username: 'mrkrabs',
      password,
      fullName: 'Eugene H. Krabs',
      role: UserRole.STUDENT,
      createdAt: getRandomDate(),
    }),
    userRepository.create({
      username: 'pearlkrabs',
      password,
      fullName: 'Pearl Krabs',
      role: UserRole.STUDENT,
      createdAt: getRandomDate(),
    }),
    userRepository.create({
      username: 'gary',
      password,
      fullName: 'Gary the Snail',
      role: UserRole.STUDENT,
      createdAt: getRandomDate(),
    }),
    userRepository.create({
      username: 'karen',
      password,
      fullName: 'Karen Plankton',
      role: UserRole.STUDENT,
      createdAt: getRandomDate(),
    }),
    userRepository.create({
      username: 'larry',
      password,
      fullName: 'Larry the Lobster',
      role: UserRole.STUDENT,
      createdAt: getRandomDate(),
    }),
    userRepository.create({
      username: 'mrspuff',
      password,
      fullName: 'Mrs. Puff',
      role: UserRole.STUDENT,
      createdAt: getRandomDate(),
    }),
    userRepository.create({
      username: 'dutchman',
      password,
      fullName: 'Flying Dutchman',
      role: UserRole.STUDENT,
      createdAt: getRandomDate(),
    }),
    userRepository.create({
      username: 'mermaidman',
      password,
      fullName: 'Mermaid Man',
      role: UserRole.STUDENT,
      createdAt: getRandomDate(),
    }),
    userRepository.create({
      username: 'barnacleboy',
      password,
      fullName: 'Barnacle Boy',
      role: UserRole.STUDENT,
      createdAt: getRandomDate(),
    }),
    userRepository.create({
      username: 'neptune',
      password,
      fullName: 'King Neptune',
      role: UserRole.STUDENT,
      createdAt: getRandomDate(),
    }),
    userRepository.create({
      username: 'bubblebass',
      password,
      fullName: 'Bubble Bass',
      role: UserRole.STUDENT,
      createdAt: getRandomDate(),
    }),
    userRepository.create({
      username: 'manray',
      password,
      fullName: 'Man Ray',
      role: UserRole.STUDENT,
      createdAt: getRandomDate(),
    }),
    userRepository.create({
      username: 'patchy',
      password,
      fullName: 'Patchy the Pirate',
      role: UserRole.STUDENT,
      createdAt: getRandomDate(),
    }),
    userRepository.create({
      username: 'dirtybubble',
      password,
      fullName: 'Dirty Bubble',
      role: UserRole.STUDENT,
      createdAt: getRandomDate(),
    }),
    userRepository.create({
      username: 'doodlebob',
      password,
      fullName: 'DoodleBob',
      role: UserRole.STUDENT,
      createdAt: getRandomDate(),
    }),
  ];

  // Save users to database
  const savedUsers = await userRepository.save(users);
  console.log(`👥 Created ${savedUsers.length} users`);

  return savedUsers;
}
