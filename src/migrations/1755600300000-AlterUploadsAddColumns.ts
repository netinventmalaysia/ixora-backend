import { MigrationInterface, QueryRunner } from "typeorm";

export class AlterUploadsAddColumns1755600300000 implements MigrationInterface {
    name = 'AlterUploadsAddColumns1755600300000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Ensure table exists (older init created only id)
        await queryRunner.query(`ALTER TABLE \`uploads\` ADD COLUMN \`storage\` varchar(50) NOT NULL DEFAULT 'sftp'`);
        await queryRunner.query(`ALTER TABLE \`uploads\` ADD COLUMN \`originalName\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`uploads\` ADD COLUMN \`filename\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`uploads\` ADD COLUMN \`path\` varchar(512) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`uploads\` ADD COLUMN \`folder\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`uploads\` ADD COLUMN \`mimeType\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`uploads\` ADD COLUMN \`size\` int NOT NULL DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE \`uploads\` ADD COLUMN \`documentType\` varchar(100) NULL`);
        await queryRunner.query(`ALTER TABLE \`uploads\` ADD COLUMN \`description\` text NULL`);
        await queryRunner.query(`ALTER TABLE \`uploads\` ADD COLUMN \`businessId\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`uploads\` ADD COLUMN \`userId\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`uploads\` ADD COLUMN \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`ALTER TABLE \`uploads\` ADD COLUMN \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)`);

        // Add foreign keys (if target tables exist)
        await queryRunner.query(`ALTER TABLE \`uploads\` ADD CONSTRAINT \`FK_uploads_business\` FOREIGN KEY (\`businessId\`) REFERENCES \`businesses\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`uploads\` ADD CONSTRAINT \`FK_uploads_user\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`uploads\` DROP FOREIGN KEY \`FK_uploads_business\``);
        await queryRunner.query(`ALTER TABLE \`uploads\` DROP FOREIGN KEY \`FK_uploads_user\``);
        await queryRunner.query(`ALTER TABLE \`uploads\` DROP COLUMN \`updatedAt\``);
        await queryRunner.query(`ALTER TABLE \`uploads\` DROP COLUMN \`createdAt\``);
        await queryRunner.query(`ALTER TABLE \`uploads\` DROP COLUMN \`userId\``);
        await queryRunner.query(`ALTER TABLE \`uploads\` DROP COLUMN \`businessId\``);
        await queryRunner.query(`ALTER TABLE \`uploads\` DROP COLUMN \`description\``);
        await queryRunner.query(`ALTER TABLE \`uploads\` DROP COLUMN \`documentType\``);
        await queryRunner.query(`ALTER TABLE \`uploads\` DROP COLUMN \`size\``);
        await queryRunner.query(`ALTER TABLE \`uploads\` DROP COLUMN \`mimeType\``);
        await queryRunner.query(`ALTER TABLE \`uploads\` DROP COLUMN \`folder\``);
        await queryRunner.query(`ALTER TABLE \`uploads\` DROP COLUMN \`path\``);
        await queryRunner.query(`ALTER TABLE \`uploads\` DROP COLUMN \`filename\``);
        await queryRunner.query(`ALTER TABLE \`uploads\` DROP COLUMN \`originalName\``);
        await queryRunner.query(`ALTER TABLE \`uploads\` DROP COLUMN \`storage\``);
    }
}
