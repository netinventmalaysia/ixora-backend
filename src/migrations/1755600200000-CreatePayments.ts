import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreatePayments1755600200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(new Table({
      name: 'payments',
      columns: [
        { name: 'id', type: 'int', isPrimary: true, isGenerated: true, generationStrategy: 'increment' },
        { name: 'orderid', type: 'varchar' },
        { name: 'tranID', type: 'varchar', isNullable: true },
        { name: 'domain', type: 'varchar', isNullable: true },
        { name: 'status', type: 'varchar', isNullable: true },
        { name: 'amount', type: 'varchar', isNullable: true },
        { name: 'currency', type: 'varchar', isNullable: true },
        { name: 'paydate', type: 'varchar', isNullable: true },
        { name: 'appcode', type: 'varchar', isNullable: true },
        { name: 'error_code', type: 'varchar', isNullable: true },
        { name: 'error_desc', type: 'varchar', isNullable: true },
        { name: 'channel', type: 'varchar', isNullable: true },
        { name: 'extraP', type: 'text', isNullable: true },
        { name: 'treq', type: 'varchar', isNullable: true },
        { name: 'user_id', type: 'varchar', isNullable: true },
        { name: 'vendor_id', type: 'varchar', isNullable: true },
        { name: 'vendor_method', type: 'varchar', isNullable: true },
        { name: 'callbackPaymentUrl', type: 'varchar', isNullable: true },
        { name: 'skey', type: 'varchar', isNullable: true },
        { name: 'createdAt', type: 'datetime', default: 'CURRENT_TIMESTAMP' },
      ],
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('payments');
  }
}
