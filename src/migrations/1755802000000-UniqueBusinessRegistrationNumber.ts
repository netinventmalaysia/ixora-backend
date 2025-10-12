import { MigrationInterface, QueryRunner } from "typeorm";

export class UniqueBusinessRegistrationNumber1755802000000 implements MigrationInterface {
    name = 'UniqueBusinessRegistrationNumber1755802000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`businesses\` ADD UNIQUE INDEX \`IDX_business_registration_number\` (\`registrationNumber\`)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`businesses\` DROP INDEX \`IDX_business_registration_number\``);
    }
}
