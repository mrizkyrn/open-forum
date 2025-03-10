import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../../modules/user/entities/user.entity';
import { UserRole } from '../../../common/enums/user-role.enum';

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
    // Admin user
    userRepository.create({
      username: 'admin',
      password,
      fullName: 'Administrator',
      role: UserRole.ADMIN,
    }),
    // Student users
    userRepository.create({
      username: '2110511091',
      password,
      fullName: 'Mochamad Rizky Ramadhan',
      role: UserRole.STUDENT,
    }),
    userRepository.create({
      username: '2110511001',
      password,
      fullName: 'Spongebob Squarepants',
      role: UserRole.STUDENT,
    }),
    userRepository.create({
      username: '2110511002',
      password,
      fullName: 'Patrick Star',
      role: UserRole.STUDENT,
    }),
    userRepository.create({
      username: '2110511003',
      password,
      fullName: 'Squidward Tentacles',
      role: UserRole.STUDENT,
    }),
    userRepository.create({
      username: '2110511004',
      password,
      fullName: 'Sandy Cheeks',
      role: UserRole.STUDENT,
    }),
    userRepository.create({
      username: '2110511005',
      password,
      fullName: 'Mr. Krabs',
      role: UserRole.STUDENT,
    }),
  ];
  
  // Save users to database
  const savedUsers = await userRepository.save(users);
  console.log(`👥 Created ${savedUsers.length} users`);
  
  return savedUsers;
}