import { MigrationInterface, QueryRunner } from "typeorm";

export class AddResetNullOption1752357616400 implements MigrationInterface {
    name = 'AddResetNullOption1752357616400'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`users\` CHANGE \`role\` \`role\` enum ('guest', 'personal', 'business', 'consultant', 'admin') NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`users\` CHANGE \`role\` \`role\` enum ('admin', 'user', 'superadmin', 'vendor', 'account', 'staff', 'consultant', 'supplier', 'customer', 'partner', 'guest', 'moderator', 'senior_management', 'board_director', 'personal') NOT NULL`);
    }

}
