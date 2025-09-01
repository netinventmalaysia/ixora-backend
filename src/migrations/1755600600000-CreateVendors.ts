import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateVendors1755600600000 implements MigrationInterface {
    name = 'CreateVendors1755600600000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`vendors\` (
            \`id\` int NOT NULL AUTO_INCREMENT,
            \`mbmbId\` int NULL,
            \`name\` varchar(255) NOT NULL,
            \`role\` varchar(64) NULL,
            \`status\` varchar(32) NULL,
            \`app_name\` varchar(64) NOT NULL,
            \`callback_payment_url\` varchar(255) NULL,
            \`order_id_prefix\` varchar(64) NULL,
            \`environment\` varchar(32) NULL,
            \`keyHash\` varchar(255) NULL,
            \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
            \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
            PRIMARY KEY (\`id\`)
        ) ENGINE=InnoDB`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE \`vendors\``);
    }
}
