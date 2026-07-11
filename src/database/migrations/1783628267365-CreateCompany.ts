import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateCompany1783628267365 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'companies',
        columns: [
          { name: 'id', type: 'varchar', length: '36', isPrimary: true },
          { name: 'name', type: 'varchar', isNullable: false },
          { name: 'email', type: 'varchar', isUnique: true, isNullable: false },
          { name: 'phone_number', type: 'varchar', isNullable: true },
          {
            name: 'currency',
            type: 'varchar',
            length: '3',
            default: "'NGN'",
            isNullable: false,
          },
          {
            name: 'settings',
            type: 'json',
            isNullable: false,
          },
          {
            name: 'logo',
            type: 'json',
            isNullable: true,
          },
          { name: 'createdAt', type: 'datetime', default: 'CURRENT_TIMESTAMP' },
          { name: 'updatedAt', type: 'datetime', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('companies');
  }
}
