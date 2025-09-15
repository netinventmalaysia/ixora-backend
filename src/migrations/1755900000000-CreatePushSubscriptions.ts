import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreatePushSubscriptions1755900000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(new Table({
      name: 'push_subscriptions',
      columns: [
        { name: 'id', type: 'int', isPrimary: true, isGenerated: true, generationStrategy: 'increment' },
        { name: 'userId', type: 'int' },
        { name: 'endpoint', type: 'varchar', length: '500' },
        { name: 'p256dh', type: 'varchar', length: '255' },
        { name: 'auth', type: 'varchar', length: '255' },
        { name: 'userAgent', type: 'varchar', length: '255', isNullable: true },
        { name: 'lastSeenAt', type: 'timestamp', isNullable: true },
        { name: 'createdAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        { name: 'updatedAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' },
      ],
    }));

    await queryRunner.createForeignKey('push_subscriptions', new TableForeignKey({
      columnNames: ['userId'],
      referencedTableName: 'users',
      referencedColumnNames: ['id'],
      onDelete: 'CASCADE',
    }));

    await queryRunner.createIndex('push_subscriptions', new TableIndex({
      name: 'IDX_push_user',
      columnNames: ['userId'],
    }));
    await queryRunner.createIndex('push_subscriptions', new TableIndex({
      name: 'IDX_push_endpoint',
      columnNames: ['endpoint'],
    }));
    await queryRunner.createIndex('push_subscriptions', new TableIndex({
      name: 'UQ_push_user_endpoint',
      columnNames: ['userId', 'endpoint'],
      isUnique: true,
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('push_subscriptions');
  }
}
