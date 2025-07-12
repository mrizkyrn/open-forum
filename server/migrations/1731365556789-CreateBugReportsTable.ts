import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateBugReportsTable1731365556789 implements MigrationInterface {
  name = 'CreateBugReportsTable1731365556789';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create bug_reports table
    await queryRunner.createTable(
      new Table({
        name: 'bug_reports',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'title',
            type: 'varchar',
            length: '255',
            isNullable: false,
            comment: 'Bug report title',
          },
          {
            name: 'description',
            type: 'text',
            isNullable: false,
            comment: 'Detailed description of the bug',
          },
          {
            name: 'steps_to_reproduce',
            type: 'text',
            isNullable: true,
            comment: 'Steps to reproduce the bug',
          },
          {
            name: 'environment',
            type: 'varchar',
            length: '255',
            isNullable: true,
            comment: 'Browser/Platform where bug occurred',
          },
          {
            name: 'priority',
            type: 'enum',
            enum: ['low', 'medium', 'high', 'critical'],
            default: "'medium'",
            isNullable: false,
            comment: 'Priority level of the bug',
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['open', 'in_progress', 'resolved', 'closed'],
            default: "'open'",
            isNullable: false,
            comment: 'Current status of the bug report',
          },
          {
            name: 'reporter_id',
            type: 'int',
            isNullable: false,
            comment: 'ID of the user who reported the bug',
          },
          {
            name: 'assigned_to_id',
            type: 'int',
            isNullable: true,
            comment: 'ID of the user assigned to fix the bug',
          },
          {
            name: 'resolution',
            type: 'text',
            isNullable: true,
            comment: 'Resolution notes or comments',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Create indexes
    await queryRunner.createIndex(
      'bug_reports',
      new TableIndex({
        name: 'idx_bug_report_status',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'bug_reports',
      new TableIndex({
        name: 'idx_bug_report_priority',
        columnNames: ['priority'],
      }),
    );

    await queryRunner.createIndex(
      'bug_reports',
      new TableIndex({
        name: 'idx_bug_report_reporter',
        columnNames: ['reporter_id'],
      }),
    );

    // Create foreign key constraints
    await queryRunner.createForeignKey(
      'bug_reports',
      new TableForeignKey({
        columnNames: ['reporter_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        name: 'fk_bug_reports_reporter',
      }),
    );

    await queryRunner.createForeignKey(
      'bug_reports',
      new TableForeignKey({
        columnNames: ['assigned_to_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
        name: 'fk_bug_reports_assigned_to',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraints
    await queryRunner.dropForeignKey('bug_reports', 'fk_bug_reports_assigned_to');
    await queryRunner.dropForeignKey('bug_reports', 'fk_bug_reports_reporter');

    // Drop indexes
    await queryRunner.dropIndex('bug_reports', 'idx_bug_report_reporter');
    await queryRunner.dropIndex('bug_reports', 'idx_bug_report_priority');
    await queryRunner.dropIndex('bug_reports', 'idx_bug_report_status');

    // Drop table
    await queryRunner.dropTable('bug_reports');
  }
}
