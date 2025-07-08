import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOAuthFields1751631469522 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add profile_picture column
    await queryRunner.query(`
            ALTER TABLE "users" 
            ADD COLUMN "profile_picture" varchar(255)
        `);

    // Add oauth_provider column
    await queryRunner.query(`
            ALTER TABLE "users" 
            ADD COLUMN "oauth_provider" varchar(50)
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop oauth_provider column
    await queryRunner.query(`
            ALTER TABLE "users" 
            DROP COLUMN "oauth_provider"
        `);

    // Drop profile_picture column
    await queryRunner.query(`
            ALTER TABLE "users" 
            DROP COLUMN "profile_picture"
        `);
  }
}
