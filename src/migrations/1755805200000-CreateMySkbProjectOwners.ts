import { MigrationInterface, QueryRunner, Table, TableIndex, TableUnique } from "typeorm";

export class CreateMySkbProjectOwners1755805200000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(new Table({
            name: 'myskb_project_owners',
            columns: [
                { name: 'id', type: 'int', isPrimary: true, isGenerated: true, generationStrategy: 'increment' },
                { name: 'projectId', type: 'int' },
                { name: 'ownerUserId', type: 'int' },
                { name: 'createdAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
            ],
            uniques: [new TableUnique({ name: 'UQ_myskb_project_owners_project_owner', columnNames: ['projectId', 'ownerUserId'] })],
        }));
        await queryRunner.createIndex('myskb_project_owners', new TableIndex({ name: 'IDX_myskb_project_owners_projectId', columnNames: ['projectId'] }));
        await queryRunner.createIndex('myskb_project_owners', new TableIndex({ name: 'IDX_myskb_project_owners_ownerUserId', columnNames: ['ownerUserId'] }));

        // Backfill: from myskb_projects.ownerId when present
        await queryRunner.query(`
            INSERT INTO myskb_project_owners (projectId, ownerUserId)
            SELECT id AS projectId, ownerId AS ownerUserId
            FROM myskb_projects
            WHERE ownerId IS NOT NULL
            ON DUPLICATE KEY UPDATE ownerUserId = VALUES(ownerUserId)
        `);

        // Also ensure presence via businesses.userId mapping for rows missing ownerId
        await queryRunner.query(`
            INSERT INTO myskb_project_owners (projectId, ownerUserId)
            SELECT p.id AS projectId, b.userId AS ownerUserId
            FROM myskb_projects p
            INNER JOIN businesses b ON b.id = p.businessId
            WHERE b.userId IS NOT NULL
            ON DUPLICATE KEY UPDATE ownerUserId = ownerUserId
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropIndex('myskb_project_owners', 'IDX_myskb_project_owners_ownerUserId');
        await queryRunner.dropIndex('myskb_project_owners', 'IDX_myskb_project_owners_projectId');
        await queryRunner.dropTable('myskb_project_owners');
    }
}
