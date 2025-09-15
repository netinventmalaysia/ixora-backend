import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateMySkbProjects1755800000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(new Table({
            name: 'myskb_projects',
            columns: [
                { name: 'id', type: 'int', isPrimary: true, isGenerated: true, generationStrategy: 'increment' },
                { name: 'businessId', type: 'int', isNullable: false },
                { name: 'userId', type: 'int', isNullable: false },
                { name: 'status', type: 'enum', enum: ['draft', 'submitted'], default: `'draft'` },
                { name: 'data', type: 'json', isNullable: false },
                { name: 'createdAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
                { name: 'updatedAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' },
            ],
        }));

        await queryRunner.createIndex('myskb_projects', new TableIndex({
            name: 'IDX_myskb_projects_biz_user_status',
            columnNames: ['businessId', 'userId', 'status'],
        }));

        await queryRunner.createForeignKey('myskb_projects', new TableForeignKey({
            columnNames: ['businessId'],
            referencedTableName: 'businesses',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
        }));
        await queryRunner.createForeignKey('myskb_projects', new TableForeignKey({
            columnNames: ['userId'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('myskb_projects');
    }
}
