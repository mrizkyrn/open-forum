import { DataSource } from 'typeorm';
import { UserRole } from '../../../common/enums/user-role.enum';
import { Discussion } from '../../../modules/discussion/entities/discussion.entity';
import { ReportReason } from '../../../modules/report/entities/report-reason.entity';
import { Report, ReportStatus, ReportTargetType } from '../../../modules/report/entities/report.entity';
import { User } from '../../../modules/user/entities/user.entity';

export async function seedReports(dataSource: DataSource): Promise<void> {
  console.log('🚩 Seeding reports...');

  const reportRepository = dataSource.getRepository(Report);
  const userRepository = dataSource.getRepository(User);
  const discussionRepository = dataSource.getRepository(Discussion);
  const reportReasonRepository = dataSource.getRepository(ReportReason);

  // Check if reports already exist
  const reportCount = await reportRepository.count();
  if (reportCount > 0) {
    console.log(`🚩 ${reportCount} reports already exist, skipping seeding`);
    return;
  }

  // Get available users (reporters)
  const users = await userRepository.find({
    where: { role: UserRole.STUDENT },
    select: ['id'],
  });

  if (users.length === 0) {
    console.error('❌ No users found for creating reports');
    return;
  }

  // Get available discussions (targets)
  const discussions = await discussionRepository.find();
  if (discussions.length === 0) {
    console.error('❌ No discussions found to report');
    return;
  }

  // Get available report reasons
  const reportReasons = await reportReasonRepository.find({
    where: { isActive: true },
  });
  if (reportReasons.length === 0) {
    console.error('❌ No report reasons found');
    return;
  }

  // Generate random date between now and a week ago
  const getRandomDate = (): Date => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return new Date(oneWeekAgo.getTime() + Math.random() * (now.getTime() - oneWeekAgo.getTime()));
  };

  // Sample report descriptions
  const reportDescriptions = [
    'This content violates community guidelines.',
    'I find this post offensive and inappropriate.',
    'This discussion contains misleading information.',
    'This user is spamming the forum with irrelevant content.',
    'The post contains hateful speech targeting specific groups.',
    'This appears to be plagiarized content.',
    'This post shares personal information without consent.',
    'The discussion promotes academic dishonesty.',
    'This content is completely off-topic for this forum.',
    undefined, // Some reports might not have descriptions
  ];

  // Create 30 random reports
  const reports: Partial<Report>[] = [];
  for (let i = 0; i < 5; i++) {
    // Select random user as reporter
    const reporter = users[Math.floor(Math.random() * users.length)];

    // Select random discussion to report
    const discussion = discussions[Math.floor(Math.random() * discussions.length)];

    // Make sure user doesn't report their own post (unless we want to allow that)
    if (reporter.id === discussion.authorId) {
      continue;
    }

    // Select random report reason
    const reason = reportReasons[Math.floor(Math.random() * reportReasons.length)];

    // Select random description or null
    const description = reportDescriptions[Math.floor(Math.random() * reportDescriptions.length)];

    // Create report
    reports.push({
      reporterId: reporter.id,
      targetType: ReportTargetType.DISCUSSION,
      targetId: discussion.id,
      reasonId: reason.id,
      description,
      status: ReportStatus.PENDING,
      createdAt: getRandomDate(),
      updatedAt: getRandomDate(),
    });
  }

  // Save reports
  const savedReports = await reportRepository.save(reports);
  console.log(`🚩 Created ${savedReports.length} reports`);
}
