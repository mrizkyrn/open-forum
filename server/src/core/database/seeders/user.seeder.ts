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

  // Create sample users
  const users = [
    // Admin
    userRepository.create({
      username: 'admin',
      password,
      fullName: 'Administrator',
      role: UserRole.ADMIN,
    }),

    // Students
    userRepository.create({
      username: 'spongebob',
      password,
      fullName: 'SpongeBob SquarePants',
      role: UserRole.STUDENT,
    }),
    userRepository.create({
      username: 'patrick',
      password,
      fullName: 'Patrick Star',
      role: UserRole.STUDENT,
    }),
    userRepository.create({
      username: 'sandy',
      password,
      fullName: 'Sandy Cheeks',
      role: UserRole.STUDENT,
    }),
    userRepository.create({
      username: 'squidward',
      password,
      fullName: 'Squidward Tentacles',
      role: UserRole.STUDENT,
    }),
    userRepository.create({
      username: 'plankton',
      password,
      fullName: 'Sheldon J. Plankton',
      role: UserRole.STUDENT,
    }),
  ];

  // Save users to database
  const savedUsers = await userRepository.save(users);
  console.log(`👥 Created ${savedUsers.length} users`);

  return savedUsers;
}
