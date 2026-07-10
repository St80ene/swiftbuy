import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreateStocksTable1783628364529 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'stocks',
        columns: [
          { name: 'id', type: 'varchar', length: '36', isPrimary: true },
          {
            name: 'product_id',
            type: 'varchar',
            length: '36',
            isNullable: false,
          },
          { name: 'type', type: 'varchar', isNullable: false },
          { name: 'reason', type: 'varchar', isNullable: false },
          { name: 'quantity', type: 'int', isNullable: false },
          {
            name: 'unit_cost_price',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'unit_selling_price',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: '0.00',
            isNullable: false,
          },
          { name: 'createdAt', type: 'datetime', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );

    // FK 1: Link to Parent Product Target
    await queryRunner.createForeignKey(
      'stocks',
      new TableForeignKey({
        columnNames: ['product_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'products',
        onDelete: 'CASCADE',
        name: 'FK_STOCKS_PRODUCT',
      }),
    );

    // Ledger Timeline Performance Optimization Index
    await queryRunner.createIndex(
      'stocks',
      new TableIndex({
        name: 'IDX_STOCKS_TIMELINE',
        columnNames: ['createdAt'], // 👈 Speeds up sorting ledger items by date
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey('stocks', 'FK_STOCKS_PRODUCT');
    await queryRunner.dropIndex('stocks', 'IDX_STOCKS_TIMELINE');
    await queryRunner.dropTable('stocks');
  }
}
