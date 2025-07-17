import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateSpaceType1752758010358 implements MigrationInterface {
    name = 'UpdateSpaceType1752758010358'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."discussion_spaces_space_type_enum" RENAME TO "discussion_spaces_space_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."discussion_spaces_space_type_enum" AS ENUM('general', 'interest', 'professional', 'community', 'organization', 'event', 'support', 'other')`);
        await queryRunner.query(`ALTER TABLE "discussion_spaces" ALTER COLUMN "space_type" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "discussion_spaces" ALTER COLUMN "space_type" TYPE "public"."discussion_spaces_space_type_enum" USING "space_type"::"text"::"public"."discussion_spaces_space_type_enum"`);
        await queryRunner.query(`ALTER TABLE "discussion_spaces" ALTER COLUMN "space_type" SET DEFAULT 'other'`);
        await queryRunner.query(`DROP TYPE "public"."discussion_spaces_space_type_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."discussion_spaces_space_type_enum_old" AS ENUM('academic', 'campus', 'general', 'organization', 'other')`);
        await queryRunner.query(`ALTER TABLE "discussion_spaces" ALTER COLUMN "space_type" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "discussion_spaces" ALTER COLUMN "space_type" TYPE "public"."discussion_spaces_space_type_enum_old" USING "space_type"::"text"::"public"."discussion_spaces_space_type_enum_old"`);
        await queryRunner.query(`ALTER TABLE "discussion_spaces" ALTER COLUMN "space_type" SET DEFAULT 'other'`);
        await queryRunner.query(`DROP TYPE "public"."discussion_spaces_space_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."discussion_spaces_space_type_enum_old" RENAME TO "discussion_spaces_space_type_enum"`);
    }

}
