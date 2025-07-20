import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBusinessRegistration1752877814646 implements MigrationInterface {
    name = 'AddBusinessRegistration1752877814646'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`businesses\` (\`id\` int NOT NULL AUTO_INCREMENT, \`companyName\` varchar(255) NOT NULL, \`registrationNumber\` varchar(255) NOT NULL, \`expiryDate\` date NOT NULL, \`certificateFilePath\` varchar(255) NOT NULL, \`phone\` varchar(255) NOT NULL, \`address\` varchar(255) NOT NULL, \`city\` varchar(255) NOT NULL, \`state\` varchar(255) NOT NULL, \`postalcode\` varchar(255) NOT NULL, \`country\` varchar(255) NOT NULL, \`accountType\` varchar(255) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE \`businesses\``);
    }

}
