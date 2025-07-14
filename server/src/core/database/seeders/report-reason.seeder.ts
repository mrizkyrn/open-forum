import { DataSource } from 'typeorm';
import { ReportReason } from '../../../modules/report/entities/report-reason.entity';

export async function seedReportReasons(dataSource: DataSource): Promise<void> {
  console.log('🌱 Seeding report reasons...');

  const reportReasonRepository = dataSource.getRepository(ReportReason);

  // Check if report reasons already exist
  const reasonCount = await reportReasonRepository.count();
  if (reasonCount > 0) {
    console.log(`🚩 ${reasonCount} report reasons already exist, skipping seeding`);
    return;
  }

  // Define common report reason categories
  const reportReasons = [
    reportReasonRepository.create({
      name: 'Spam',
      description: 'Excessive, repetitive, or irrelevant content that disrupts the forum',
      isActive: true,
    }),
    reportReasonRepository.create({
      name: 'Harassment',
      description: 'Content that targets, threatens, or intimidates other users',
      isActive: true,
    }),
    reportReasonRepository.create({
      name: 'Inappropriate Content',
      description: 'Content containing explicit, offensive, or otherwise unsuitable material',
      isActive: true,
    }),
    reportReasonRepository.create({
      name: 'Misinformation',
      description: 'Content containing false or misleading information',
      isActive: true,
    }),
    reportReasonRepository.create({
      name: 'Copyright Violation',
      description: 'Content that infringes on intellectual property rights',
      isActive: true,
    }),
    reportReasonRepository.create({
      name: 'Hate Speech',
      description: 'Content expressing hatred or prejudice toward particular groups',
      isActive: true,
    }),
    reportReasonRepository.create({
      name: 'Academic Dishonesty',
      description: 'Content promoting cheating, plagiarism, or other academic ethics violations',
      isActive: true,
    }),
    reportReasonRepository.create({
      name: 'Other',
      description: 'Other violations not covered by the categories above',
      isActive: true,
    }),
  ];

  // Save report reasons
  const savedReasons = await reportReasonRepository.save(reportReasons);
  console.log(`🚩 Created ${savedReasons.length} report reasons`);
}
