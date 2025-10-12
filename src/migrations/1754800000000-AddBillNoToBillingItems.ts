import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBillNoToBillingItems1754800000000 implements MigrationInterface {
    name = 'AddBillNoToBillingItems1754800000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE billing_items ADD COLUMN bill_no varchar(128) NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE billing_items DROP COLUMN bill_no`);
    }
}
