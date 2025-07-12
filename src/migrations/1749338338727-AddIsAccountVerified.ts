import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIsAccountVerified1749338338727 implements MigrationInterface {
    name = 'AddIsAccountVerified1749338338727'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`users\` CHANGE \`staffId\` \`isAccountVerified\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`isAccountVerified\``);
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`isAccountVerified\` tinyint NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`users\` CHANGE \`role\` \`role\` enum ('admin', 'user', 'superadmin', 'vendor', 'account', 'staff', 'consultant', 'supplier', 'customer', 'partner', 'guest', 'moderator', 'senior_management', 'board_director') NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`users\` CHANGE \`role\` \`role\` enum ('admin', 'user', 'superadmin') NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`isAccountVerified\``);
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`isAccountVerified\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`users\` CHANGE \`isAccountVerified\` \`staffId\` varchar(255) NULL`);
    }

}
