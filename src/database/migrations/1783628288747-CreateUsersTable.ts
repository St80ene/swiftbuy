import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateUsersTable1783628288747 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'company_id',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          { name: 'first_name', type: 'varchar', isNullable: false },
          { name: 'last_name', type: 'varchar', isNullable: false },
          { name: 'email', type: 'varchar', isNullable: false },
          { name: 'password', type: 'varchar', isNullable: false },
          {
            name: 'role',
            type: 'varchar',
            isNullable: false,
            default: "'CASHIER'",
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
            isNullable: false,
          },
          { name: 'createdAt', type: 'datetime', default: 'CURRENT_TIMESTAMP' },
          { name: 'updatedAt', type: 'datetime', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey('users', 'FK_USERS_COMPANY');
    await queryRunner.dropTable('users');
  }
}
