import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1748176130563 implements MigrationInterface {
    name = 'Init1748176130563'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`staffId\` varchar(255) NOT NULL DEFAULT 0`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`staffId\``);
    }

}
