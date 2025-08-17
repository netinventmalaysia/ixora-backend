import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTeamMemberToken1755400000000 implements MigrationInterface {
    name = 'AddTeamMemberToken1755400000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE ` + '\`team_members\`' + ` ADD ` + '\`token\`' + ` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE ` + '\`team_members\`' + ` ADD ` + '\`tokenExpires\`' + ` datetime(6) NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE ` + '\`team_members\`' + ` DROP COLUMN ` + '\`tokenExpires\`');
        await queryRunner.query(`ALTER TABLE ` + '\`team_members\`' + ` DROP COLUMN ` + '\`token\`');
    }

}
