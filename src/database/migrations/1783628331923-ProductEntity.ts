import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class ProductEntity1783628331923 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'products',
        columns: [
          { name: 'id', type: 'varchar', length: '36', isPrimary: true }, // 👈 Clean string UUID
          { name: 'name', type: 'varchar', isNullable: false },
          { name: 'description', type: 'varchar', isNullable: true },
          { name: 'images', type: 'json', isNullable: false },
          {
            name: 'stock_quantity',
            type: 'int',
            isNullable: false,
            default: 0,
          },
          {
            name: 'cost_price',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: '0.00',
            isNullable: false,
          },
          {
            name: 'selling_price',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'category',
            type: 'varchar',
            isNullable: true,
            default: "''",
          },
          { name: 'createdAt', type: 'datetime', default: 'CURRENT_TIMESTAMP' },
          { name: 'updatedAt', type: 'datetime', default: 'CURRENT_TIMESTAMP' },
          { name: 'deletedAt', type: 'datetime', isNullable: true },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('products');
  }
}
