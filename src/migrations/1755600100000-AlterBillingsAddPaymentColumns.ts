import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AlterBillingsAddPaymentColumns1755600100000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('billings', [
      new TableColumn({ name: 'paidAt', type: 'datetime', isNullable: true }),
      new TableColumn({ name: 'paidAmount', type: 'decimal', precision: 12, scale: 2, isNullable: true }),
  new TableColumn({ name: 'paymentGatewayTransactionId', type: 'varchar', isNullable: true }),
  new TableColumn({ name: 'paymentGatewayRefNo', type: 'varchar', isNullable: true }),
  new TableColumn({ name: 'paymentGatewayStatus', type: 'varchar', isNullable: true }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
  await queryRunner.dropColumn('billings', 'paymentGatewayStatus');
  await queryRunner.dropColumn('billings', 'paymentGatewayRefNo');
  await queryRunner.dropColumn('billings', 'paymentGatewayTransactionId');
    await queryRunner.dropColumn('billings', 'paidAmount');
    await queryRunner.dropColumn('billings', 'paidAt');
  }
}
