import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBusinessTeam1752931852432 implements MigrationInterface {
    name = 'AddBusinessTeam1752931852432'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`team_members\` (\`id\` int NOT NULL AUTO_INCREMENT, \`businessId\` int NOT NULL, \`email\` varchar(255) NOT NULL, \`role\` varchar(255) NOT NULL DEFAULT 'pending', \`invitedBy\` int NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE \`team_members\``);
    }

}
