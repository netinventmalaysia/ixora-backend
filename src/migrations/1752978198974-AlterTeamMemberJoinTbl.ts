import { MigrationInterface, QueryRunner } from "typeorm";

export class AlterTeamMemberJoinTbl1752978198974 implements MigrationInterface {
    name = 'AlterTeamMemberJoinTbl1752978198974'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`team_members\` ADD CONSTRAINT \`FK_773b5b5c399a13af9538fbbd76b\` FOREIGN KEY (\`businessId\`) REFERENCES \`businesses\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`team_members\` ADD CONSTRAINT \`FK_0a72b849753a046462b4c5a8ec2\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`team_members\` DROP FOREIGN KEY \`FK_0a72b849753a046462b4c5a8ec2\``);
        await queryRunner.query(`ALTER TABLE \`team_members\` DROP FOREIGN KEY \`FK_773b5b5c399a13af9538fbbd76b\``);
    }

}
