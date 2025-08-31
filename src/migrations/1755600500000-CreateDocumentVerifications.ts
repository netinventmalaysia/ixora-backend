import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateDocumentVerifications1755600500000 implements MigrationInterface {
    name = 'CreateDocumentVerifications1755600500000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`document_verifications\` (
            \`id\` int NOT NULL AUTO_INCREMENT,
            \`businessId\` int NOT NULL,
            \`uploadId\` int NOT NULL,
            \`documentType\` varchar(64) NOT NULL,
            \`extractedCompanyName\` varchar(255) NULL,
            \`extractedRegistrationNumber\` varchar(64) NULL,
            \`extractedExpiryDate\` date NULL,
            \`matchCompanyName\` tinyint NULL,
            \`matchRegistrationNumber\` tinyint NULL,
            \`matchExpiry\` tinyint NULL,
            \`confidence\` decimal(5,2) NULL,
            \`status\` enum ('PENDING','PASSED','FAILED','NEEDS_REVIEW') NOT NULL DEFAULT 'PENDING',
            \`reason\` text NULL,
            \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
            \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
            PRIMARY KEY (\`id\`)
        ) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`document_verifications\` ADD CONSTRAINT \`FK_docver_business\` FOREIGN KEY (\`businessId\`) REFERENCES \`businesses\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`document_verifications\` ADD CONSTRAINT \`FK_docver_upload\` FOREIGN KEY (\`uploadId\`) REFERENCES \`uploads\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`document_verifications\` DROP FOREIGN KEY \`FK_docver_upload\``);
        await queryRunner.query(`ALTER TABLE \`document_verifications\` DROP FOREIGN KEY \`FK_docver_business\``);
        await queryRunner.query(`DROP TABLE \`document_verifications\``);
    }
}
