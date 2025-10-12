import { MigrationInterface, QueryRunner } from "typeorm";

export class DeduplicateBusinessRegistrationNumbers1755801999000 implements MigrationInterface {
    name = 'DeduplicateBusinessRegistrationNumbers1755801999000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Append -<id> to duplicate registrationNumber rows, keeping the lowest id unchanged
        await queryRunner.query(`
            UPDATE businesses b
            JOIN (
                SELECT b2.id, b2.registrationNumber
                FROM businesses b2
                JOIN (
                    SELECT registrationNumber, MIN(id) AS keep_id
                    FROM businesses
                    GROUP BY registrationNumber
                    HAVING COUNT(*) > 1
                ) d ON b2.registrationNumber = d.registrationNumber AND b2.id <> d.keep_id
            ) x ON b.id = x.id
            SET b.registrationNumber = CONCAT(b.registrationNumber, '-', b.id)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Irreversible: we cannot reliably restore original duplicates
    }
}
