import { MigrationInterface, QueryRunner, Table, TableColumn, TableForeignKey, TableIndex, TableUnique } from 'typeorm';

export class CreateReviewWorkflow1768000000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP TABLE IF EXISTS `review_workflow_stage_members`');
        await queryRunner.query('DROP TABLE IF EXISTS `review_workflow_stages`');
        await queryRunner.createTable(new Table({
            name: 'review_workflow_stages',
            columns: [
                { name: 'id', type: 'int', isPrimary: true, isGenerated: true, generationStrategy: 'increment' },
                { name: 'module', type: 'varchar', length: '64' },
                { name: 'stage', type: "enum", enum: ['level1', 'level2', 'final'] },
                { name: 'order_index', type: 'int', default: 0 },
                { name: 'enabled', type: 'boolean', default: true },
                { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
                { name: 'updated_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' },
            ],
        }));
        await queryRunner.createIndex('review_workflow_stages', new TableIndex({ name: 'IDX_review_workflow_stages_module', columnNames: ['module'] }));
        await queryRunner.createIndex('review_workflow_stages', new TableIndex({
            name: 'UQ_review_workflow_stage',
            columnNames: ['module', 'stage'],
            isUnique: true,
        }));

        await queryRunner.createTable(new Table({
            name: 'review_workflow_stage_members',
            columns: [
                { name: 'id', type: 'int', isPrimary: true, isGenerated: true, generationStrategy: 'increment' },
                { name: 'stage_id', type: 'int' },
                { name: 'user_id', type: 'int' },
                { name: 'user_email', type: 'varchar', length: '255' },
                { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
                { name: 'updated_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' },
            ],
            foreignKeys: [
                new TableForeignKey({
                    columnNames: ['stage_id'],
                    referencedTableName: 'review_workflow_stages',
                    referencedColumnNames: ['id'],
                    onDelete: 'CASCADE',
                }),
                new TableForeignKey({
                    columnNames: ['user_id'],
                    referencedTableName: 'users',
                    referencedColumnNames: ['id'],
                    onDelete: 'CASCADE',
                }),
            ],
        }));
        await queryRunner.createIndex('review_workflow_stage_members', new TableIndex({
            name: 'UQ_review_workflow_stage_members_stage_user',
            columnNames: ['stage_id', 'user_id'],
            isUnique: true,
        }));

        await queryRunner.addColumn('myskb_projects', new TableColumn({
            name: 'currentReviewStage',
            type: 'enum',
            enum: ['level1', 'level2', 'final'],
            isNullable: true,
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn('myskb_projects', 'currentReviewStage');
        await queryRunner.dropTable('review_workflow_stage_members');
        await queryRunner.dropTable('review_workflow_stages');
    }
}
