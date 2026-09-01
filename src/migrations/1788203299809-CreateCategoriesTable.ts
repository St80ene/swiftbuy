import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableColumn,
  TableForeignKey,
  TableUnique,
} from 'typeorm';

export class CreateCategoriesTable1788203299809 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'categories',
        columns: [
          {
            name: 'id',
            type: 'char',
            length: '36',
            isPrimary: true,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
            isUnique: true,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'business_id',
            type: 'char',
            length: '36',
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Category belongs to a business
    await queryRunner.createForeignKey(
      'categories',
      new TableForeignKey({
        name: 'FK_categories_business',
        columnNames: ['business_id'],
        referencedTableName: 'businesses',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    );

    // A business cannot have duplicate category names
    await queryRunner.createUniqueConstraint(
      'categories',
      new TableUnique({
        name: 'UQ_categories_business_name',
        columnNames: ['business_id', 'name'],
      }),
    );

    await queryRunner.addColumn(
      'products',
      new TableColumn({
        name: 'category_id',
        type: 'char',
        length: '36',
        isNullable: true,
      }),
    );

    await queryRunner.createForeignKey(
      'products',
      new TableForeignKey({
        name: 'FK_products_category',
        columnNames: ['category_id'],
        referencedTableName: 'categories',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove product -> category relationship
    const productsTable = await queryRunner.getTable('products');

    if (productsTable) {
      const foreignKey = productsTable.foreignKeys.find(
        (fk) => fk.name === 'FK_products_category',
      );

      if (foreignKey) {
        await queryRunner.dropForeignKey('products', foreignKey);
      }
    }

    await queryRunner.dropColumn('products', 'category_id');

    // Remove category -> business relationship
    const categoriesTable = await queryRunner.getTable('categories');

    if (categoriesTable) {
      const businessForeignKey = categoriesTable.foreignKeys.find(
        (fk) => fk.name === 'FK_categories_business',
      );

      if (businessForeignKey) {
        await queryRunner.dropForeignKey('categories', businessForeignKey);
      }

      const uniqueConstraint = categoriesTable.uniques.find(
        (unique) => unique.name === 'UQ_categories_business_name',
      );

      if (uniqueConstraint) {
        await queryRunner.dropUniqueConstraint('categories', uniqueConstraint);
      }
    }

    await queryRunner.dropTable('categories');
  }
}
