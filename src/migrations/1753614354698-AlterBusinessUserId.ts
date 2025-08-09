import { MigrationInterface, QueryRunner } from "typeorm";

export class AlterBusinessUserId1753614354698 implements MigrationInterface {
    name = 'AlterBusinessUserId1753614354698'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`businesses\` ADD \`userId\` int NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`businesses\` DROP COLUMN \`userId\``);
    }

}
