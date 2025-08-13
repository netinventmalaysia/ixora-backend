import { MigrationInterface, QueryRunner } from "typeorm";

export class AlterUserEmailValidation1753611725525 implements MigrationInterface {
    name = 'AlterUserEmailValidation1753611725525'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`id_type\` enum ('old_ic', 'new_ic', 'passport', 'tentera') NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`id_number\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`verificationToken\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`verificationTokenExpires\` datetime NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`verificationTokenExpires\``);
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`verificationToken\``);
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`id_number\``);
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`id_type\``);
    }

}
