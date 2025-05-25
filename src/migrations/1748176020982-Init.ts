import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1748176020982 implements MigrationInterface {
    name = 'Init1748176020982'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`email\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`firstName\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`lastName\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`isActive\` tinyint NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`createdAt\` datetime NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`updatedAt\` datetime NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`lastLogin\` datetime NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`isEmailVerified\` tinyint NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`profilePicture\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`bio\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`phoneNumber\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`address\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`dateOfBirth\` datetime NULL`);
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`preferences\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`isTwoFactorEnabled\` tinyint NOT NULL DEFAULT 0`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`isTwoFactorEnabled\``);
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`preferences\``);
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`dateOfBirth\``);
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`address\``);
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`phoneNumber\``);
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`bio\``);
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`profilePicture\``);
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`isEmailVerified\``);
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`lastLogin\``);
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`updatedAt\``);
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`createdAt\``);
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`isActive\``);
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`lastName\``);
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`firstName\``);
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`email\``);
    }

}
