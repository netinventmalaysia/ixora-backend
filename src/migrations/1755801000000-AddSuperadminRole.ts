import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSuperadminRole1755801000000 implements MigrationInterface {
    name = 'AddSuperadminRole1755801000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            "ALTER TABLE `users` MODIFY `role` enum('guest','personal','business','consultant','admin','superadmin') NOT NULL DEFAULT 'personal'"
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            "ALTER TABLE `users` MODIFY `role` enum('guest','personal','business','consultant','admin') NOT NULL DEFAULT 'personal'"
        );
    }
}
