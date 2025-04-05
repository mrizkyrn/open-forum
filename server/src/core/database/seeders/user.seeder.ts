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
    userRepository.create({
      username: 'admin',
      password,
      fullName: 'Administrator',
      role: UserRole.ADMIN,
    }),
  ];

  // Save users to database
  const savedUsers = await userRepository.save(users);
  console.log(`👥 Created ${savedUsers.length} users`);

  return savedUsers;
}
