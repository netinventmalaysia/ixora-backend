import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddProjectGeoColumns1766265700000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumns('myskb_projects', [
            new TableColumn({
                name: 'latitude',
                type: 'decimal',
                precision: 10,
                scale: 7,
                isNullable: true,
            }),
            new TableColumn({
                name: 'longitude',
                type: 'decimal',
                precision: 10,
                scale: 7,
                isNullable: true,
            }),
        ]);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn('myskb_projects', 'longitude');
        await queryRunner.dropColumn('myskb_projects', 'latitude');
    }
}
