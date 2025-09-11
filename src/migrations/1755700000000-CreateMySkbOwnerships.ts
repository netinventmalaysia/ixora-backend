import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from "typeorm";

export class CreateMySkbOwnerships1755700000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(new Table({
            name: 'myskb_ownerships',
            columns: [
                { name: 'id', type: 'int', isPrimary: true, isGenerated: true, generationStrategy: 'increment' },
                { name: 'businessId', type: 'int', isNullable: false },
                { name: 'userId', type: 'int', isNullable: true },
                { name: 'email', type: 'varchar', isNullable: false },
                { name: 'name', type: 'varchar', isNullable: true },
                { name: 'role', type: 'varchar', isNullable: true },
                { name: 'project', type: 'varchar', isNullable: true },
                { name: 'avatarUrl', type: 'varchar', isNullable: true },
                { name: 'lastSeenIso', type: 'varchar', isNullable: true },
                { name: 'status', type: 'enum', enum: ['Pending', 'Approved', 'Rejected'], default: `'Pending'` },
                { name: 'scope', type: 'enum', enum: ['project-only', 'full'], isNullable: true },
                { name: 'inviteToken', type: 'varchar', isNullable: true },
                { name: 'inviteTokenExpires', type: 'timestamp', isNullable: true },
                { name: 'createdAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
                { name: 'updatedAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' },
            ]
        }));

        await queryRunner.createIndex('myskb_ownerships', new TableIndex({
            name: 'IDX_myskb_ownership_business_email',
            columnNames: ['businessId', 'email'],
            isUnique: true,
        }));

        await queryRunner.createForeignKey('myskb_ownerships', new TableForeignKey({
            columnNames: ['businessId'],
            referencedColumnNames: ['id'],
            referencedTableName: 'businesses',
            onDelete: 'CASCADE',
        }));

        await queryRunner.createForeignKey('myskb_ownerships', new TableForeignKey({
            columnNames: ['userId'],
            referencedColumnNames: ['id'],
            referencedTableName: 'users',
            onDelete: 'SET NULL',
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('myskb_ownerships');
    }
}
