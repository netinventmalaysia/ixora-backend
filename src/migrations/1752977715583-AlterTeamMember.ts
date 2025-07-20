import { MigrationInterface, QueryRunner } from "typeorm";

export class AlterTeamMember1752977715583 implements MigrationInterface {
    name = 'AlterTeamMember1752977715583'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`team_members\` ADD \`userId\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`team_members\` ADD \`status\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`team_members\` CHANGE \`role\` \`role\` varchar(255) NOT NULL DEFAULT 'personal'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`team_members\` CHANGE \`role\` \`role\` varchar(255) NOT NULL DEFAULT 'pending'`);
        await queryRunner.query(`ALTER TABLE \`team_members\` DROP COLUMN \`status\``);
        await queryRunner.query(`ALTER TABLE \`team_members\` DROP COLUMN \`userId\``);
    }

}
