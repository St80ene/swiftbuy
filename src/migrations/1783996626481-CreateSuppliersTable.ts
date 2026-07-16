import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateSuppliersTable1783996626481 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'suppliers',
        columns: [
          { name: 'id', type: 'varchar', length: '36', isPrimary: true },
          {
            name: 'name',
            type: 'varchar',
            isUnique: true,
          },
          {
            name: 'email',
            type: 'varchar',
            isNullable: true,
          },
          { name: 'createdAt', type: 'datetime', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('suppliers');
  }
}
