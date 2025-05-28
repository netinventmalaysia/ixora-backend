import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1748471768475 implements MigrationInterface {
    name = 'Init1748471768475'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`users\` (\`id\` int NOT NULL AUTO_INCREMENT, \`username\` varchar(255) NOT NULL, \`password\` varchar(255) NOT NULL, \`email\` varchar(255) NOT NULL, \`firstName\` varchar(255) NOT NULL, \`lastName\` varchar(255) NOT NULL, \`isActive\` tinyint NOT NULL, \`createdAt\` datetime NOT NULL, \`updatedAt\` datetime NOT NULL, \`lastLogin\` datetime NULL, \`isEmailVerified\` tinyint NOT NULL, \`role\` varchar(255) NOT NULL, \`profilePicture\` varchar(255) NULL, \`bio\` varchar(255) NULL, \`phoneNumber\` varchar(255) NULL, \`address\` varchar(255) NULL, \`dateOfBirth\` datetime NULL, \`preferences\` varchar(255) NULL, \`isTwoFactorEnabled\` tinyint NOT NULL DEFAULT 0, \`staffId\` varchar(255) NOT NULL DEFAULT 0, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`uploads\` (\`id\` int NOT NULL AUTO_INCREMENT, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE \`uploads\``);
        await queryRunner.query(`DROP TABLE \`users\``);
    }

}
