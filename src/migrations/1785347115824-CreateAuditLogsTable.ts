import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';
import { AuditLogAction, AuditLogEntity } from '../enum/audit_log.enum';

export class CreateAuditLogsTable1785347115824 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'audit_logs',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
          },
          {
            name: 'user_id',
            type: 'varchar',
            length: '36',
            isNullable: true,
          },
          {
            name: 'action',
            type: 'enum',
            enum: Object.values(AuditLogAction),
          },
          {
            name: 'entity',
            type: 'enum',
            enum: Object.values(AuditLogEntity),
          },
          {
            name: 'entity_id',
            type: 'varchar',
            length: '36',
          },
          {
            name: 'old_value',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'new_value',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'audit_logs',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      }),
    );

    await queryRunner.createIndices('audit_logs', [
      new TableIndex({
        name: 'IDX_AUDIT_USER',
        columnNames: ['user_id'],
      }),
      new TableIndex({
        name: 'IDX_AUDIT_ACTION',
        columnNames: ['action'],
      }),
      new TableIndex({
        name: 'IDX_AUDIT_ENTITY',
        columnNames: ['entity'],
      }),
      new TableIndex({
        name: 'IDX_AUDIT_ENTITY_ID',
        columnNames: ['entity_id'],
      }),
      new TableIndex({
        name: 'IDX_AUDIT_CREATED_AT',
        columnNames: ['created_at'],
      }),
      new TableIndex({
        name: 'IDX_AUDIT_ENTITY_LOOKUP',
        columnNames: ['entity', 'entity_id'],
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('audit_logs', 'IDX_AUDIT_USER');
    await queryRunner.dropIndex('audit_logs', 'IDX_AUDIT_ACTION');
    await queryRunner.dropIndex('audit_logs', 'IDX_AUDIT_ENTITY');
    await queryRunner.dropIndex('audit_logs', 'IDX_AUDIT_ENTITY_ID');
    await queryRunner.dropIndex('audit_logs', 'IDX_AUDIT_CREATED_AT');
    await queryRunner.dropIndex('audit_logs', 'IDX_AUDIT_ENTITY_LOOKUP');

    const table = await queryRunner.getTable('audit_logs');
    if (table) {
      const foreignKey = table.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('user_id') !== -1,
      );
      if (foreignKey) {
        await queryRunner.dropForeignKey('audit_logs', foreignKey);
      }
    }
    await queryRunner.dropTable('audit_logs');
  }
}
