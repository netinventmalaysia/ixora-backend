import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreateBillingTables1755600000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(new Table({
      name: 'billings',
      columns: [
        { name: 'id', type: 'int', isPrimary: true, isGenerated: true, generationStrategy: 'increment' },
        { name: 'reference', type: 'varchar', isUnique: true },
        { name: 'businessId', type: 'int' },
        { name: 'userId', type: 'int', isNullable: true },
        { name: 'status', type: 'enum', enum: ['CREATED','PAID','UNPAID','SUCCESS'], default: "'CREATED'" },
        { name: 'totalAmount', type: 'decimal', precision: 12, scale: 2, default: '0' },
        { name: 'currency', type: 'varchar', length: '8', default: "'MYR'" },
        { name: 'mbmbSubmittedAt', type: 'datetime', isNullable: true },
        { name: 'createdAt', type: 'datetime', default: 'CURRENT_TIMESTAMP' },
        { name: 'updatedAt', type: 'datetime', default: 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' },
      ],
    }));

    await queryRunner.createTable(new Table({
      name: 'billing_items',
      columns: [
        { name: 'id', type: 'int', isPrimary: true, isGenerated: true, generationStrategy: 'increment' },
        { name: 'billingId', type: 'int' },
        { name: 'order_no', type: 'varchar' },
        { name: 'jenis', type: 'varchar', length: '2' },
        { name: 'no_akaun', type: 'varchar' },
        { name: 'amaun', type: 'decimal', precision: 12, scale: 2 },
        { name: 'status', type: 'enum', enum: ['CREATED','PAID','UNPAID','SUCCESS'], default: "'CREATED'" },
        { name: 'createdAt', type: 'datetime', default: 'CURRENT_TIMESTAMP' },
        { name: 'updatedAt', type: 'datetime', default: 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' },
      ],
    }));

    await queryRunner.createForeignKey('billings', new TableForeignKey({
      columnNames: ['businessId'],
      referencedTableName: 'businesses',
      referencedColumnNames: ['id'],
      onDelete: 'CASCADE',
    }));

    await queryRunner.createForeignKey('billing_items', new TableForeignKey({
      columnNames: ['billingId'],
      referencedTableName: 'billings',
      referencedColumnNames: ['id'],
      onDelete: 'CASCADE',
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE billing_items DROP FOREIGN KEY billing_items_billingId_fk');
    await queryRunner.dropTable('billing_items');
    await queryRunner.dropTable('billings');
  }
}
