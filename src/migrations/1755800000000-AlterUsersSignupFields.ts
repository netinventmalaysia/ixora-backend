import { MigrationInterface, QueryRunner } from "typeorm";

export class AlterUsersSignupFields1755800000000 implements MigrationInterface {
    name = 'AlterUsersSignupFields1755800000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`users\` MODIFY \`username\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`users\` MODIFY \`lastName\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`users\` MODIFY \`role\` enum('guest','personal','business','consultant','admin') NOT NULL DEFAULT 'personal'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`users\` MODIFY \`role\` enum('guest','personal','business','consultant','admin') NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`users\` MODIFY \`lastName\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`users\` MODIFY \`username\` varchar(255) NOT NULL`);
    }
}
