import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AlterBillingsAddPaymentColumns1755600100000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('billings', [
      new TableColumn({ name: 'paidAt', type: 'datetime', isNullable: true }),
      new TableColumn({ name: 'paidAmount', type: 'decimal', precision: 12, scale: 2, isNullable: true }),
      new TableColumn({ name: 'pgTransactionId', type: 'varchar', isNullable: true }),
      new TableColumn({ name: 'pgRefNo', type: 'varchar', isNullable: true }),
      new TableColumn({ name: 'pgStatus', type: 'varchar', isNullable: true }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('billings', 'pgStatus');
    await queryRunner.dropColumn('billings', 'pgRefNo');
    await queryRunner.dropColumn('billings', 'pgTransactionId');
    await queryRunner.dropColumn('billings', 'paidAmount');
    await queryRunner.dropColumn('billings', 'paidAt');
  }
}
