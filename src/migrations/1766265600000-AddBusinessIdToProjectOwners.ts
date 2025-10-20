import { MigrationInterface, QueryRunner, TableColumn, TableIndex } from "typeorm";

export class AddBusinessIdToProjectOwners1766265600000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1) Add column
        await queryRunner.addColumn('myskb_project_owners', new TableColumn({
            name: 'businessId',
            type: 'int',
            isNullable: true, // temporarily nullable for backfill
        }));

        // 2) Backfill from myskb_projects
        await queryRunner.query(`
            UPDATE myskb_project_owners mpo
            INNER JOIN myskb_projects p ON p.id = mpo.projectId
            SET mpo.businessId = p.businessId
            WHERE mpo.businessId IS NULL
        `);

        // 3) Make non-nullable
        await queryRunner.changeColumn('myskb_project_owners', 'businessId', new TableColumn({
            name: 'businessId',
            type: 'int',
            isNullable: false,
        }));

        // 4) Add index for fast lookups
        await queryRunner.createIndex('myskb_project_owners', new TableIndex({
            name: 'IDX_myskb_project_owners_businessId',
            columnNames: ['businessId'],
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropIndex('myskb_project_owners', 'IDX_myskb_project_owners_businessId');
        await queryRunner.dropColumn('myskb_project_owners', 'businessId');
    }
}
