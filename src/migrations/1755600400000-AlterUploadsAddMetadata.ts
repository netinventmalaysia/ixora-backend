import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from "typeorm";

export class AlterUploadsAddMetadata1755600400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasTable = await queryRunner.hasTable('uploads');
    if (!hasTable) return;

    const columns = await queryRunner.getTable('uploads');
    const existing = new Set(columns?.columns.map(c => c.name));

    const add = async (col: TableColumn) => {
      if (!existing.has(col.name)) await queryRunner.addColumn('uploads', col);
    }

    await add(new TableColumn({ name: 'storage', type: 'varchar', default: "'sftp'" }));
    await add(new TableColumn({ name: 'originalName', type: 'varchar' }));
    await add(new TableColumn({ name: 'filename', type: 'varchar' }));
    await add(new TableColumn({ name: 'path', type: 'varchar', length: '512' }));
    await add(new TableColumn({ name: 'folder', type: 'varchar', isNullable: true }));
    await add(new TableColumn({ name: 'mimeType', type: 'varchar', isNullable: true }));
    await add(new TableColumn({ name: 'size', type: 'int', default: 0 }));
    await add(new TableColumn({ name: 'documentType', type: 'varchar', isNullable: true }));
    await add(new TableColumn({ name: 'description', type: 'text', isNullable: true }));
    await add(new TableColumn({ name: 'businessId', type: 'int', isNullable: true }));
    await add(new TableColumn({ name: 'userId', type: 'int', isNullable: true }));
    if (!existing.has('createdAt')) await queryRunner.addColumn('uploads', new TableColumn({ name: 'createdAt', type: 'datetime', default: 'CURRENT_TIMESTAMP' }));
    if (!existing.has('updatedAt')) await queryRunner.addColumn('uploads', new TableColumn({ name: 'updatedAt', type: 'datetime', default: 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' }));

    // FKs
    const table = await queryRunner.getTable('uploads');
    const hasBusinessFk = table?.foreignKeys.some(fk => fk.columnNames.includes('businessId'));
    if (!hasBusinessFk) {
      await queryRunner.createForeignKey('uploads', new TableForeignKey({
        columnNames: ['businessId'],
        referencedTableName: 'businesses',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }));
    }
    const hasUserFk = table?.foreignKeys.some(fk => fk.columnNames.includes('userId'));
    if (!hasUserFk) {
      await queryRunner.createForeignKey('uploads', new TableForeignKey({
        columnNames: ['userId'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }));
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasTable = await queryRunner.hasTable('uploads');
    if (!hasTable) return;

    const table = await queryRunner.getTable('uploads');
    // Drop FKs first
    for (const fk of table?.foreignKeys || []) {
      if (fk.columnNames.includes('businessId') || fk.columnNames.includes('userId')) {
        await queryRunner.dropForeignKey('uploads', fk);
      }
    }

    const dropIfExists = async (name: string) => {
      const tbl = await queryRunner.getTable('uploads');
      if (tbl?.columns.find(c => c.name === name)) await queryRunner.dropColumn('uploads', name);
    }

    await dropIfExists('updatedAt');
    await dropIfExists('createdAt');
    await dropIfExists('userId');
    await dropIfExists('businessId');
    await dropIfExists('description');
    await dropIfExists('documentType');
    await dropIfExists('size');
    await dropIfExists('mimeType');
    await dropIfExists('folder');
    await dropIfExists('path');
    await dropIfExists('filename');
    await dropIfExists('originalName');
    await dropIfExists('storage');
  }
}
