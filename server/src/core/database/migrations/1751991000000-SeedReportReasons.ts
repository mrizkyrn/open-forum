import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedReportReasons1751991000000 implements MigrationInterface {
  name = 'SeedReportReasons1751991000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "report_reasons" ("name", "description", "isActive", "created_at", "updated_at") VALUES
      ('Spam', 'Excessive, repetitive, or irrelevant content that disrupts the forum', true, NOW(), NOW()),
      ('Harassment', 'Content that targets, threatens, or intimidates other users', true, NOW(), NOW()),
      ('Inappropriate Content', 'Content containing explicit, offensive, or otherwise unsuitable material', true, NOW(), NOW()),
      ('Misinformation', 'Content containing false or misleading information', true, NOW(), NOW()),
      ('Copyright Violation', 'Content that infringes on intellectual property rights', true, NOW(), NOW()),
      ('Hate Speech', 'Content expressing hatred or prejudice toward particular groups', true, NOW(), NOW()),
      ('Academic Dishonesty', 'Content promoting cheating, plagiarism, or other academic ethics violations', true, NOW(), NOW()),
      ('Other', 'Other violations not covered by the categories above', true, NOW(), NOW());
    `);

    console.log('✅ Seeded admin user and report reasons');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "report_reasons" WHERE "name" IN (
        'Spam', 'Harassment', 'Inappropriate Content', 'Misinformation',
        'Copyright Violation', 'Hate Speech', 'Academic Dishonesty', 'Other'
      );
    `);

    console.log('✅ Removed seeded admin user and report reasons');
  }
}
