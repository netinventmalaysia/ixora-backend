import { MigrationInterface, QueryRunner } from "typeorm";

export class AlterBillingItemRenameColumns1756671227989 implements MigrationInterface {
    name = 'AlterBillingItemRenameColumns1756671227989'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Rename columns: jenis -> item_type, no_akaun -> account_no, amaun -> amount
        const table = 'billing_items';
        // MySQL/MariaDB support ALTER TABLE CHANGE for rename with type definitions
        await queryRunner.query(`ALTER TABLE \`${table}\` CHANGE \`jenis\` \`item_type\` varchar(2) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`${table}\` CHANGE \`no_akaun\` \`account_no\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`${table}\` CHANGE \`amaun\` \`amount\` decimal(12,2) NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = 'billing_items';
        await queryRunner.query(`ALTER TABLE \`${table}\` CHANGE \`item_type\` \`jenis\` varchar(2) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`${table}\` CHANGE \`account_no\` \`no_akaun\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`${table}\` CHANGE \`amount\` \`amaun\` decimal(12,2) NOT NULL`);
    }
}
