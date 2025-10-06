import { MigrationInterface, QueryRunner } from "typeorm";

export class AlterBillingsBusinessIdNullable1754700000000 implements MigrationInterface {
    name = 'AlterBillingsBusinessIdNullable1754700000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // MySQL: modify column to allow null
        await queryRunner.query(`ALTER TABLE billings MODIFY businessId int NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revert to NOT NULL (may fail if null rows exist)
        await queryRunner.query(`ALTER TABLE billings MODIFY businessId int NOT NULL`);
    }
}
