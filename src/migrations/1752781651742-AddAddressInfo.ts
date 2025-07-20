import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAddressInfo1752781651742 implements MigrationInterface {
    name = 'AddAddressInfo1752781651742'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`city\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`state\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`postalcode\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`country\` varchar(255) NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`country\``);
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`postalcode\``);
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`state\``);
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`city\``);
    }

}
