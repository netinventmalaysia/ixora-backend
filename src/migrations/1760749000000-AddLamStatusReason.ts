import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLamStatusReason1760749000000 implements MigrationInterface {
    name = 'AddLamStatusReason1760749000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`businesses\` ADD \`lamStatusReason\` varchar(255) NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`businesses\` DROP COLUMN \`lamStatusReason\``);
    }
}
