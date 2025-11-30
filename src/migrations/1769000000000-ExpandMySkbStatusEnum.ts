import { MigrationInterface, QueryRunner } from 'typeorm';

const NEW_STATUSES = [
  'draft',
  'submitted',
  'approved',
  'pending_payment',
  'paid',
  'pending_processing_payment',
  'processing_payment_paid',
  'pending_permit_payment',
  'permit_active',
  'rejected',
  'expired',
  'pending_renewal',
  'project_completed',
  'project_onhold',
  'project_cancelled',
];

const PREVIOUS_STATUSES = [
  'draft',
  'submitted',
  'approved',
  'pending_payment',
  'paid',
  'rejected',
  'expired',
  'pending_renewal',
  'project_completed',
  'project_onhold',
  'project_cancelled',
];

export class ExpandMySkbStatusEnum1769000000000 implements MigrationInterface {
  name = 'ExpandMySkbStatusEnum1769000000000';

  private buildAlterSql(values: string[]): string {
    const enumList = values.map((value) => `\'${value}\'`).join(', ');
    return `ALTER TABLE \`myskb_projects\` CHANGE \`status\` \`status\` enum (${enumList}) NOT NULL DEFAULT 'draft'`;
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(this.buildAlterSql(NEW_STATUSES));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(this.buildAlterSql(PREVIOUS_STATUSES));
  }
}
