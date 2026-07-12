import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUomToProduct1783830437182 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`products\` 
      ADD COLUMN \`uom_type\` VARCHAR(20) NOT NULL DEFAULT 'UNIT', -- 'UNIT', 'WEIGHT', 'VOLUME'
      ADD COLUMN \`uom_base_name\` VARCHAR(10) NOT NULL DEFAULT 'pcs', -- 'pcs', 'g', 'ml'
      ADD COLUMN \`uom_display_name\` VARCHAR(10) NOT NULL DEFAULT 'pcs'; -- 'pcs', 'kg', 'L'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`products\`
      DROP COLUMN \`uom_type\`,
      DROP COLUMN \`uom_base_name\`,
      DROP COLUMN \`uom_display_name\`;
    `);
  }
}
