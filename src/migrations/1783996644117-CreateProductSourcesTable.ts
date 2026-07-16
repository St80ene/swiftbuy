import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateProductSourcesTable1783996644117 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'product_sources',
        columns: [
          { name: 'id', type: 'varchar', length: '36', isPrimary: true },
          {
            name: 'product_id',
            type: 'varchar',
            length: '36',
            isUnique: true,
          },
          {
            name: 'supplier_id',
            type: 'varchar',
            length: '36',
          },
          { name: 'createdAt', type: 'datetime', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'product_sources',
      new TableForeignKey({
        columnNames: ['product_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'products',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'product_sources',
      new TableForeignKey({
        columnNames: ['supplier_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'suppliers',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 1. Get the table instance to find the foreign keys
    const table = await queryRunner.getTable('product_sources');

    if (table) {
      // 2. Find and drop the foreign keys by name/constraint safely
      const productFk = table.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('product_id') !== -1,
      );
      if (productFk) {
        await queryRunner.dropForeignKey('product_sources', productFk);
      }

      const supplierFk = table.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('supplier_id') !== -1,
      );
      if (supplierFk) {
        await queryRunner.dropForeignKey('product_sources', supplierFk);
      }
    }

    // 3. Now it is 100% safe to drop the table
    await queryRunner.dropTable('product_sources');
  }
}
