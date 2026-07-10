import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1783699991545 implements MigrationInterface {
  name = 'InitialSchema1783699991545';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`products\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(255) NOT NULL, \`description\` varchar(255) NULL, \`images\` json NOT NULL DEFAULT ('[]'), \`stock_quantity\` int NOT NULL DEFAULT '0', \`cost_price\` decimal(10,2) NOT NULL DEFAULT '0.00', \`selling_price\` decimal(10,2) NOT NULL, \`category\` varchar(255) NULL DEFAULT '', \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` datetime(6) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`stocks\` (\`id\` varchar(36) NOT NULL, \`product_id\` varchar(36) NOT NULL, \`type\` varchar(255) NOT NULL DEFAULT 'INFLOW', \`reason\` varchar(255) NOT NULL DEFAULT 'SUPPLIER_RESTOCK', \`quantity\` int NOT NULL, \`unit_cost_price\` decimal(10,2) NOT NULL, \`unit_selling_price\` decimal(10,2) NOT NULL DEFAULT '0.00', \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`users\` (\`id\` varchar(36) NOT NULL, \`first_name\` varchar(100) NOT NULL, \`last_name\` varchar(100) NOT NULL, \`email\` varchar(150) NOT NULL, \`password\` varchar(255) NOT NULL, \`role\` varchar(20) NOT NULL DEFAULT 'CASHIER', \`is_active\` tinyint NOT NULL DEFAULT 1, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_97672ac88f789774dd47f7c8be\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`companies\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(255) NOT NULL, \`email\` varchar(255) NOT NULL, \`phone_number\` varchar(255) NULL, \`currency\` varchar(255) NOT NULL DEFAULT 'NGN', \`logo\` json NULL, \`settings\` json NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` datetime(6) NULL, UNIQUE INDEX \`IDX_d0af6f5866201d5cb424767744\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX \`IDX_d0af6f5866201d5cb424767744\` ON \`companies\``,
    );
    await queryRunner.query(`DROP TABLE \`companies\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_97672ac88f789774dd47f7c8be\` ON \`users\``,
    );
    await queryRunner.query(`DROP TABLE \`users\``);
    await queryRunner.query(`DROP TABLE \`stocks\``);
    await queryRunner.query(`DROP TABLE \`products\``);
  }
}
