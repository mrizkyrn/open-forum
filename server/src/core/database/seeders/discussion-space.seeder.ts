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

  // Check if admin user exists
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

  // GENERAL spaces for discussion without space type
  spaces.push(
    {
      name: 'General',
      description: 'A space for general discussions and topics',
      slug: 'general',
      creatorId: adminUser.id,
      spaceType: SpaceType.GENERAL,
    }
  );

  // INTEREST spaces
  spaces.push(
    {
      name: 'Tech & Innovation',
      description: 'Discussions about technology trends and innovations',
      slug: 'tech-innovation',
      creatorId: adminUser.id,
      spaceType: SpaceType.INTEREST,
    },
    {
      name: 'Arts & Culture',
      description: 'For all arts and cultural activities',
      slug: 'arts-culture',
      creatorId: adminUser.id,
      spaceType: SpaceType.INTEREST,
    },
    {
      name: 'Sports & Fitness',
      description: 'Share and discuss sports, fitness, and wellness',
      slug: 'sports-fitness',
      creatorId: adminUser.id,
      spaceType: SpaceType.INTEREST,
    },
    {
      name: 'Gaming',
      description: 'Gaming news, tips, and community',
      slug: 'gaming',
      creatorId: adminUser.id,
      spaceType: SpaceType.INTEREST,
    },
    {
      name: 'Books & Literature',
      description: 'Discuss books, authors, and literature',
      slug: 'books-literature',
      creatorId: adminUser.id,
      spaceType: SpaceType.INTEREST,
    },
    {
      name: 'Travel & Adventure',
      description: 'Share travel stories and tips',
      slug: 'travel-adventure',
      creatorId: adminUser.id,
      spaceType: SpaceType.INTEREST,
    },
  );

  // PROFESSIONAL spaces
  spaces.push(
    {
      name: 'Career Development',
      description: 'Career advice, job opportunities, and professional development',
      slug: 'career-development',
      creatorId: adminUser.id,
      spaceType: SpaceType.PROFESSIONAL,
    },
    {
      name: 'Networking',
      description: 'Connect and network with professionals',
      slug: 'networking',
      creatorId: adminUser.id,
      spaceType: SpaceType.PROFESSIONAL,
    },
    {
      name: 'Entrepreneurship',
      description: 'Share ideas and resources for entrepreneurs',
      slug: 'entrepreneurship',
      creatorId: adminUser.id,
      spaceType: SpaceType.PROFESSIONAL,
    },
    {
      name: 'Remote Work',
      description: 'Tips and discussions about working remotely',
      slug: 'remote-work',
      creatorId: adminUser.id,
      spaceType: SpaceType.PROFESSIONAL,
    },
    {
      name: 'Freelancing',
      description: 'Resources and support for freelancers',
      slug: 'freelancing',
      creatorId: adminUser.id,
      spaceType: SpaceType.PROFESSIONAL,
    },
  );

  // COMMUNITY spaces
  spaces.push(
    {
      name: 'Marketplace',
      description: 'Buy, sell, and exchange items with the community',
      slug: 'marketplace',
      creatorId: adminUser.id,
      spaceType: SpaceType.COMMUNITY,
    },
    {
      name: 'Local Events',
      description: 'Share and discover local events',
      slug: 'local-events',
      creatorId: adminUser.id,
      spaceType: SpaceType.COMMUNITY,
    },
    {
      name: 'Neighborhood Watch',
      description: 'Community safety and awareness',
      slug: 'neighborhood-watch',
      creatorId: adminUser.id,
      spaceType: SpaceType.COMMUNITY,
    },
    {
      name: 'Volunteering',
      description: 'Find and share volunteering opportunities',
      slug: 'volunteering',
      creatorId: adminUser.id,
      spaceType: SpaceType.COMMUNITY,
    },
  );

  // ORGANIZATION spaces
  spaces.push(
    {
      name: 'Community Groups',
      description: 'Official space for community organizations',
      slug: 'community-groups',
      creatorId: adminUser.id,
      spaceType: SpaceType.ORGANIZATION,
    },
    {
      name: 'Nonprofits',
      description: 'Discussion space for nonprofit organizations',
      slug: 'nonprofits',
      creatorId: adminUser.id,
      spaceType: SpaceType.ORGANIZATION,
    },
    {
      name: 'Clubs & Societies',
      description: 'Clubs, societies, and interest groups',
      slug: 'clubs-societies',
      creatorId: adminUser.id,
      spaceType: SpaceType.ORGANIZATION,
    },
    {
      name: 'Professional Associations',
      description: 'Connect with professional associations',
      slug: 'professional-associations',
      creatorId: adminUser.id,
      spaceType: SpaceType.ORGANIZATION,
    },
  );

  // EVENT spaces
  spaces.push(
    {
      name: 'Events',
      description: 'Stay updated with all public events and meetups',
      slug: 'events',
      creatorId: adminUser.id,
      spaceType: SpaceType.EVENT,
    },
    {
      name: 'Workshops & Seminars',
      description: 'Find and discuss workshops and seminars',
      slug: 'workshops-seminars',
      creatorId: adminUser.id,
      spaceType: SpaceType.EVENT,
    },
    {
      name: 'Concerts & Festivals',
      description: 'Share and discover concerts and festivals',
      slug: 'concerts-festivals',
      creatorId: adminUser.id,
      spaceType: SpaceType.EVENT,
    },
    {
      name: 'Webinars',
      description: 'Online webinars and virtual events',
      slug: 'webinars',
      creatorId: adminUser.id,
      spaceType: SpaceType.EVENT,
    },
  );

  // SUPPORT spaces
  spaces.push(
    {
      name: 'Support & Help',
      description: 'Get help and support from other members',
      slug: 'support-help',
      creatorId: adminUser.id,
      spaceType: SpaceType.SUPPORT,
    },
    {
      name: 'Q&A',
      description: 'Ask questions and get answers from the community',
      slug: 'qna',
      creatorId: adminUser.id,
      spaceType: SpaceType.SUPPORT,
    },
    {
      name: 'Mental Health',
      description: 'Support and resources for mental health',
      slug: 'mental-health',
      creatorId: adminUser.id,
      spaceType: SpaceType.SUPPORT,
    },
    {
      name: 'Parenting & Family',
      description: 'Advice and support for parents and families',
      slug: 'parenting-family',
      creatorId: adminUser.id,
      spaceType: SpaceType.SUPPORT,
    },
    {
      name: 'Legal Advice',
      description: 'Get legal advice and share experiences',
      slug: 'legal-advice',
      creatorId: adminUser.id,
      spaceType: SpaceType.SUPPORT,
    },
  );

  // OTHER spaces
  spaces.push(
    {
      name: 'Housing & Accommodation',
      description: 'Discussions about housing and accommodation options',
      slug: 'housing-accommodation',
      creatorId: adminUser.id,
      spaceType: SpaceType.OTHER,
    },
    {
      name: 'Feedback & Suggestions',
      description: 'Share feedback and suggestions for the platform',
      slug: 'feedback-suggestions',
      creatorId: adminUser.id,
      spaceType: SpaceType.OTHER,
    },
    {
      name: 'Lost & Found',
      description: 'Report and find lost items',
      slug: 'lost-found',
      creatorId: adminUser.id,
      spaceType: SpaceType.OTHER,
    },
    {
      name: 'Random',
      description: 'Anything that doesn’t fit other categories',
      slug: 'random',
      creatorId: adminUser.id,
      spaceType: SpaceType.OTHER,
    },
  );

  // Save spaces
  const savedSpaces = await spaceRepository.save(spaces);
  console.log(`🌐 Created ${savedSpaces.length} discussion spaces`);
}
