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
    userRepository.create({
      username: '2110511006',
      password,
      fullName: 'Plankton',
      role: UserRole.STUDENT,
    }),
    userRepository.create({
      username: '2110511007',
      password,
      fullName: 'Mrs. Puff',
      role: UserRole.STUDENT,
    }),
    userRepository.create({
      username: '2110511008',
      password,
      fullName: 'Pearl Krabs',
      role: UserRole.STUDENT,
    }),
    userRepository.create({
      username: '2110511009',
      password,
      fullName: 'Larry the Lobster',
      role: UserRole.STUDENT,
    }),
    userRepository.create({
      username: '2110511010',
      password,
      fullName: 'Flying Dutchman',
      role: UserRole.STUDENT,
    }),
    userRepository.create({
      username: '2110511011',
      password,
      fullName: 'Mermaid Man',
      role: UserRole.STUDENT,
    }),
    userRepository.create({
      username: '2110511012',
      password,
      fullName: 'Barnacle Boy',
      role: UserRole.STUDENT,
    }),
    userRepository.create({
      username: '2110511013',
      password,
      fullName: 'King Neptune',
      role: UserRole.STUDENT,
    }),
    userRepository.create({
      username: '2110511014',
      password,
      fullName: 'Karen Plankton',
      role: UserRole.STUDENT,
    }),
    userRepository.create({
      username: '2110511015',
      password,
      fullName: 'David Johnson',
      role: UserRole.STUDENT,
    }),
    userRepository.create({
      username: '2110511016',
      password,
      fullName: 'Sarah Williams',
      role: UserRole.STUDENT,
    }),
    userRepository.create({
      username: '2110511017',
      password,
      fullName: 'Michael Brown',
      role: UserRole.STUDENT,
    }),
    userRepository.create({
      username: '2110511018',
      password,
      fullName: 'Jessica Davis',
      role: UserRole.STUDENT,
    }),
    userRepository.create({
      username: '2110511019',
      password,
      fullName: 'Daniel Miller',
      role: UserRole.STUDENT,
    }),
    userRepository.create({
      username: '2110511020',
      password,
      fullName: 'Emily Wilson',
      role: UserRole.STUDENT,
    }),
    userRepository.create({
      username: '2110511021',
      password,
      fullName: 'Matthew Moore',
      role: UserRole.STUDENT,
    }),
    userRepository.create({
      username: '2110511022',
      password,
      fullName: 'Olivia Taylor',
      role: UserRole.STUDENT,
    }),
    userRepository.create({
      username: '2110511023',
      password,
      fullName: 'Christopher Anderson',
      role: UserRole.STUDENT,
    }),
    userRepository.create({
      username: '2110511024',
      password,
      fullName: 'Sophia Thomas',
      role: UserRole.STUDENT,
    }),
    userRepository.create({
      username: '2110511025',
      password,
      fullName: 'Joshua Jackson',
      role: UserRole.STUDENT,
    }),
    userRepository.create({
      username: '2110511026',
      password,
      fullName: 'Ava White',
      role: UserRole.STUDENT,
    }),
    userRepository.create({
      username: '2110511027',
      password,
      fullName: 'Andrew Harris',
      role: UserRole.STUDENT,
    }),
    userRepository.create({
      username: '2110511028',
      password,
      fullName: 'Isabella Martin',
      role: UserRole.STUDENT,
    }),
    userRepository.create({
      username: '2110511029',
      password,
      fullName: 'Ryan Thompson',
      role: UserRole.STUDENT,
    }),
    userRepository.create({
      username: '2110511030',
      password,
      fullName: 'Mia Garcia',
      role: UserRole.STUDENT,
    }),
    userRepository.create({
      username: '2110511031',
      password,
      fullName: 'Dylan Martinez',
      role: UserRole.STUDENT,
    }),
    userRepository.create({
      username: '2110511032',
      password,
      fullName: 'Emma Robinson',
      role: UserRole.STUDENT,
    }),
    userRepository.create({
      username: '2110511033',
      password,
      fullName: 'Justin Clark',
      role: UserRole.STUDENT,
    }),
    userRepository.create({
      username: '2110511034',
      password,
      fullName: 'Abigail Rodriguez',
      role: UserRole.STUDENT,
    }),
    userRepository.create({
      username: '2110511035',
      password,
      fullName: 'Brandon Lewis',
      role: UserRole.STUDENT,
    }),
    userRepository.create({
      username: '2110511036',
      password,
      fullName: 'Chloe Lee',
      role: UserRole.STUDENT,
    }),
    userRepository.create({
      username: '2110511037',
      password,
      fullName: 'Tyler Walker',
      role: UserRole.STUDENT,
    }),
    userRepository.create({
      username: '2110511038',
      password,
      fullName: 'Grace Hall',
      role: UserRole.STUDENT,
    }),
    userRepository.create({
      username: '2110511039',
      password,
      fullName: 'Zachary Allen',
      role: UserRole.STUDENT,
    }),
    userRepository.create({
      username: '2110511040',
      password,
      fullName: 'Lily Young',
      role: UserRole.STUDENT,
    }),
    userRepository.create({
      username: '2110511041',
      password,
      fullName: 'Benjamin King',
      role: UserRole.STUDENT,
    }),
    userRepository.create({
      username: '2110511042',
      password,
      fullName: 'Hannah Wright',
      role: UserRole.STUDENT,
    }),
    userRepository.create({
      username: '2110511043',
      password,
      fullName: 'Samuel Lopez',
      role: UserRole.STUDENT,
    }),
    userRepository.create({
      username: '2110511044',
      password,
      fullName: 'Addison Hill',
      role: UserRole.STUDENT,
    }),
    userRepository.create({
      username: '2110511045',
      password,
      fullName: 'Jonathan Scott',
      role: UserRole.STUDENT,
    }),
    userRepository.create({
      username: '2110511046',
      password,
      fullName: 'Victoria Green',
      role: UserRole.STUDENT,
    }),
    userRepository.create({
      username: '2110511047',
      password,
      fullName: 'Nathan Adams',
      role: UserRole.STUDENT,
    }),
    userRepository.create({
      username: '2110511048',
      password,
      fullName: 'Ella Baker',
      role: UserRole.STUDENT,
    }),
    userRepository.create({
      username: '2110511049',
      password,
      fullName: 'Christian Gonzalez',
      role: UserRole.STUDENT,
    }),
    userRepository.create({
      username: '2110511050',
      password,
      fullName: 'Sofia Nelson',
      role: UserRole.STUDENT,
    }),
  ];

  // Save users to database
  const savedUsers = await userRepository.save(users);
  console.log(`👥 Created ${savedUsers.length} users`);

  return savedUsers;
}
