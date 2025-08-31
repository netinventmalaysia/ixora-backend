import { MigrationInterface, QueryRunner } from "typeorm";

export class RenameBillingItemColumns1755600300000 implements MigrationInterface {
  name = 'RenameBillingItemColumns1755600300000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Rename columns if they exist; guard against repeated runs
    const table = await queryRunner.getTable('billing_items');
    if (!table) return;

    const hasJenis = table.columns.find(c => c.name === 'jenis');
    const hasItemType = table.columns.find(c => c.name === 'item_type');
    if (hasJenis && !hasItemType) {
      await queryRunner.query('ALTER TABLE `billing_items` CHANGE `jenis` `item_type` varchar(2) NOT NULL');
    }

    const hasNoAkaun = table.columns.find(c => c.name === 'no_akaun');
    const hasAccountNo = table.columns.find(c => c.name === 'account_no');
    if (hasNoAkaun && !hasAccountNo) {
      await queryRunner.query('ALTER TABLE `billing_items` CHANGE `no_akaun` `account_no` varchar(255) NOT NULL');
    }

    const hasAmaun = table.columns.find(c => c.name === 'amaun');
    const hasAmount = table.columns.find(c => c.name === 'amount');
    if (hasAmaun && !hasAmount) {
      await queryRunner.query('ALTER TABLE `billing_items` CHANGE `amaun` `amount` decimal(12,2) NOT NULL');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('billing_items');
    if (!table) return;

    const hasItemType = table.columns.find(c => c.name === 'item_type');
    const hasJenis = table.columns.find(c => c.name === 'jenis');
    if (hasItemType && !hasJenis) {
      await queryRunner.query('ALTER TABLE `billing_items` CHANGE `item_type` `jenis` varchar(2) NOT NULL');
    }

    const hasAccountNo = table.columns.find(c => c.name === 'account_no');
    const hasNoAkaun = table.columns.find(c => c.name === 'no_akaun');
    if (hasAccountNo && !hasNoAkaun) {
      await queryRunner.query('ALTER TABLE `billing_items` CHANGE `account_no` `no_akaun` varchar(255) NOT NULL');
    }

    const hasAmount = table.columns.find(c => c.name === 'amount');
    const hasAmaun = table.columns.find(c => c.name === 'amaun');
    if (hasAmount && !hasAmaun) {
      await queryRunner.query('ALTER TABLE `billing_items` CHANGE `amount` `amaun` decimal(12,2) NOT NULL');
    }
  }
}
