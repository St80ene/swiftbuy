import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePurchaseOrdersAndItemsTables1783830480089 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
          CREATE TABLE \`purchase_orders\` (
            \`id\` varchar(36) NOT NULL,
            \`po_number\` varchar(50) NOT NULL UNIQUE,
            \`supplier_id\` varchar(255) NOT NULL,
            \`status\` varchar(30) NOT NULL DEFAULT 'DRAFT',
            \`total_estimated_cost\` decimal(10,2) NOT NULL DEFAULT '0.00',
            \`created_by_id\` varchar(36) NOT NULL,
            \`approved_by_id\` varchar(36) NULL,
            \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
            \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
            PRIMARY KEY (\`id\`)
          ) ENGINE=InnoDB;
        `);

    await queryRunner.query(`
          CREATE TABLE \`purchase_order_items\` (
            \`id\` varchar(36) NOT NULL,
            \`purchase_order_id\` varchar(36) NOT NULL,
            \`product_id\` varchar(36) NOT NULL,
            \`quantity_requested\` int NOT NULL,
            \`estimated_unit_cost\` decimal(10,2) NOT NULL,
            PRIMARY KEY (\`id\`)
          ) ENGINE=InnoDB;
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        DROP TABLE \`purchase_order_items\`;
    `);

    await queryRunner.query(`
        DROP TABLE \`purchase_orders\`;
    `);
  }
}
