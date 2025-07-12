import { DataSource } from 'typeorm';
import { UserRole } from '../../../common/enums/user-role.enum';
import { DiscussionSpace, SpaceType } from '../../../modules/discussion/entities/discussion-space.entity';
import { User } from '../../../modules/user/entities/user.entity';

export async function seedDiscussionSpaces(dataSource: DataSource): Promise<void> {
  console.log('🌱 Seeding discussion spaces...');

  const spaceRepository = dataSource.getRepository(DiscussionSpace);
  const userRepository = dataSource.getRepository(User);

  // Check if spaces already exist
  const spaceCount = await spaceRepository.count();
  if (spaceCount > 0) {
    console.log(`🌐 ${spaceCount} spaces already exist, skipping seeding`);
    return;
  }

  // Get admin and faculty users
  const adminUser = await userRepository.findOne({
    where: { role: UserRole.ADMIN },
    select: ['id'],
  });

  if (!adminUser) {
    console.error('❌ Admin user not found, skipping space seeding');
    return;
  }

  // Create sample spaces
  const spaces: Array<{
    name: string;
    description: string;
    slug: string;
    creatorId: number;
    spaceType: SpaceType;
    iconUrl?: string;
    bannerUrl?: string;
  }> = [];

  // 1. CAMPUS spaces
  spaces.push(
    {
      name: 'General',
      description: 'General discussion space for all students and faculty',
      slug: 'general',
      creatorId: adminUser.id,
      spaceType: SpaceType.CAMPUS,
    },
    {
      name: 'UPNVJ Campus Hub',
      description: 'Central discussion space for all UPNVJ campus activities and announcements',
      slug: 'upnvj-campus-hub',
      creatorId: adminUser.id,
      spaceType: SpaceType.CAMPUS,
    },
    {
      name: 'Campus Events',
      description: 'Stay updated with all events happening around the campus',
      slug: 'campus-events',
      creatorId: adminUser.id,
      spaceType: SpaceType.CAMPUS,
    },
    {
      name: 'Campus Facilities',
      description: 'Discussions about campus facilities, maintenance, and improvements',
      slug: 'campus-facilities',
      creatorId: adminUser.id,
      spaceType: SpaceType.CAMPUS,
    },
  );

  // 2. ACADEMIC spaces
  spaces.push(
    {
      name: 'Research Discussions',
      description: 'Academic space dedicated to research methodologies and findings',
      slug: 'research-discussions',
      creatorId: adminUser.id,
      spaceType: SpaceType.ACADEMIC,
    },
    {
      name: 'Academic Resources',
      description: 'Share and discuss academic resources, papers, and learning materials',
      slug: 'academic-resources',
      creatorId: adminUser.id,
      spaceType: SpaceType.ACADEMIC,
    },
    {
      name: 'Scholarship Information',
      description: 'Information and discussions about scholarships and academic funding',
      slug: 'scholarship-info',
      creatorId: adminUser.id,
      spaceType: SpaceType.ACADEMIC,
    },
    {
      name: 'Academic Conferences',
      description: 'Updates and discussions about academic conferences and symposiums',
      slug: 'academic-conferences',
      creatorId: adminUser.id,
      spaceType: SpaceType.ACADEMIC,
    },
  );

  // 3. ORGANIZATION spaces
  spaces.push(
    {
      name: 'Student Government',
      description: 'Official space for the university student government',
      slug: 'student-government',
      creatorId: adminUser.id,
      spaceType: SpaceType.ORGANIZATION,
    },
    {
      name: 'Academic Senate',
      description: 'Discussion space for Academic Senate matters',
      slug: 'academic-senate',
      creatorId: adminUser.id,
      spaceType: SpaceType.ORGANIZATION,
    },
    {
      name: 'Debate Club',
      description: 'UPNVJ Debate Club official discussion space',
      slug: 'debate-club',
      creatorId: adminUser.id,
      spaceType: SpaceType.ORGANIZATION,
    },
    {
      name: 'Computer Science Society',
      description: 'Space for the Computer Science Student Society',
      slug: 'cs-society',
      creatorId: adminUser.id,
      spaceType: SpaceType.ORGANIZATION,
    },
    {
      name: 'Arts & Culture Association',
      description: 'For all arts and cultural activities in the university',
      slug: 'arts-culture-assoc',
      creatorId: adminUser.id,
      spaceType: SpaceType.ORGANIZATION,
    },
  );

  // 4. OTHER spaces
  spaces.push(
    {
      name: 'Student Marketplace',
      description: 'Buy, sell, and exchange items with other students',
      slug: 'student-marketplace',
      creatorId: adminUser.id,
      spaceType: SpaceType.OTHER,
    },
    {
      name: 'Housing & Accommodation',
      description: 'Discussions about student housing and accommodation options',
      slug: 'housing-accommodation',
      creatorId: adminUser.id,
      spaceType: SpaceType.OTHER,
    },
    {
      name: 'Career Development',
      description: 'Career advice, job opportunities, and professional development',
      slug: 'career-development',
      creatorId: adminUser.id,
      spaceType: SpaceType.OTHER,
    },
    {
      name: 'Tech Discussions',
      description: 'Discussions about technology trends and innovations',
      slug: 'tech-discussions',
      creatorId: adminUser.id,
      spaceType: SpaceType.OTHER,
    },
  );

  // Save spaces
  const savedSpaces = await spaceRepository.save(spaces);
  console.log(`🌐 Created ${savedSpaces.length} discussion spaces`);
}
