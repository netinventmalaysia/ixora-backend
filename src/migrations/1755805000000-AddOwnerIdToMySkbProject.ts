import { MigrationInterface, QueryRunner, TableColumn, TableIndex } from "typeorm";

export class AddOwnerIdToMySkbProject1755805000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn('myskb_projects', new TableColumn({
            name: 'ownerId',
            type: 'int',
            isNullable: true,
        }));
        // Backfill ownerId using businesses.userId
        await queryRunner.query(`
            UPDATE myskb_projects p
            INNER JOIN businesses b ON b.id = p.businessId
            SET p.ownerId = b.userId
            WHERE p.ownerId IS NULL
        `);
        // Create index on ownerId
        try {
            await queryRunner.createIndex('myskb_projects', new TableIndex({
                name: 'IDX_myskb_projects_ownerId',
                columnNames: ['ownerId'],
            }));
        } catch {
            // ignore if already exists
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        try {
            await queryRunner.dropIndex('myskb_projects', 'IDX_myskb_projects_ownerId');
        } catch { }
        await queryRunner.dropColumn('myskb_projects', 'ownerId');
    }
}
