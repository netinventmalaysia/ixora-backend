import { MigrationInterface, QueryRunner } from "typeorm";

export class AlterTeamMemberStatus1752988924055 implements MigrationInterface {
    name = 'AlterTeamMemberStatus1752988924055'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`team_members\` CHANGE \`status\` \`status\` varchar(255) NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`team_members\` CHANGE \`status\` \`status\` varchar(255) NOT NULL`);
    }

}
