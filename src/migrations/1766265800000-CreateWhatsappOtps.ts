import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateWhatsappOtps1766265800000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(new Table({
      name: 'whatsapp_otps',
      columns: [
        { name: 'id', type: 'int', isPrimary: true, isGenerated: true, generationStrategy: 'increment' },
        { name: 'phone', type: 'varchar', length: '32' },
        { name: 'purpose', type: 'varchar', length: '32', default: `'registration'` },
        { name: 'code', type: 'varchar', length: '16' },
        { name: 'status', type: 'varchar', length: '16', default: `'pending'` },
        { name: 'attempts', type: 'int', default: 0 },
        { name: 'maxAttempts', type: 'int', default: 5 },
        { name: 'expiresAt', type: 'datetime' },
        { name: 'lastSentAt', type: 'datetime', isNullable: true },
        { name: 'messageId', type: 'varchar', length: '128', isNullable: true },
        { name: 'createdAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        { name: 'updatedAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' },
      ],
    }));
    await queryRunner.createIndex('whatsapp_otps', new TableIndex({ name: 'IDX_whatsapp_otps_phone_purpose_status', columnNames: ['phone', 'purpose', 'status'] }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('whatsapp_otps');
  }
}
