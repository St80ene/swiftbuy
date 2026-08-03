import { MigrationInterface, QueryRunner } from 'typeorm';
import { randomUUID } from 'crypto';

export class SeedDefaultRoles1785451531000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const roles = [
      {
        id: randomUUID(),
        name: 'SUPER_ADMIN',
        description: 'System administrator',
      },
      {
        id: randomUUID(),
        name: 'ADMIN',
        description: 'Business owner',
      },
      {
        id: randomUUID(),
        name: 'MANAGER',
        description: 'Warehouse or branch manager',
      },
      {
        id: randomUUID(),
        name: 'STOREMAN',
        description: 'Warehouse/store operator',
      },
      {
        id: randomUUID(),
        name: 'CASHIER',
        description: 'Sales cashier',
      },
    ];

    await queryRunner.manager
      .createQueryBuilder()
      .insert()
      .into('roles')
      .values(roles)
      .execute();
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM roles
      WHERE name IN (
        'SUPER_ADMIN',
        'ADMIN',
        'MANAGER',
        'STOREMAN',
        'CASHIER'
      )
    `);
  }
}
