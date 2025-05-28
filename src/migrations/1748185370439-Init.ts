import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1748185370439 implements MigrationInterface {
    name = 'Init1748185370439'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`uploads\` (\`id\` int NOT NULL AUTO_INCREMENT, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE \`uploads\``);
    }

}
