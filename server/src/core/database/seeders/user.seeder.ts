import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import { UserRole } from '../../../common/enums/user-role.enum';
import { User } from '../../../modules/user/entities/user.entity';

export async function seedUsers(dataSource: DataSource): Promise<void> {
  console.log('🌱 Seeding users...');

  const userRepository = dataSource.getRepository(User);

  // Check if admin specifically exists
  const adminExists = await userRepository.findOne({ where: { username: 'admin' } });
  if (adminExists) {
    console.log('👥 Admin user already exists, skipping seeding');
    return;
  }

  // Define the admin username and password
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;

  if (!username || !password) {
    throw new Error('ADMIN_USERNAME and ADMIN_PASSWORD must be set in the environment variables');
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create the admin user
  const adminUser = userRepository.create({
    username,
    password: hashedPassword,
    fullName: 'Administrator',
    role: UserRole.ADMIN,
  });

  // Save the admin user to the database
  await userRepository.save(adminUser);

  console.log(`👤 Admin user created successfully`);
}
