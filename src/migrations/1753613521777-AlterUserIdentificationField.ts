import { MigrationInterface, QueryRunner } from "typeorm";

export class AlterUserIdentificationField1753613521777 implements MigrationInterface {
    name = 'AlterUserIdentificationField1753613521777'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`id_number\``);
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`id_type\``);
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`identificationType\` enum ('old_ic', 'new_ic', 'passport', 'tentera') NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`identificationNumber\` varchar(255) NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`identificationNumber\``);
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`identificationType\``);
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`id_type\` enum ('old_ic', 'new_ic', 'passport', 'tentera') NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`id_number\` varchar(255) NOT NULL`);
    }

}
