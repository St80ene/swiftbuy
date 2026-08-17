// import { randomUUID } from 'crypto';
// import { MigrationInterface, QueryRunner } from 'typeorm';

// export class SeedPermissions implements MigrationInterface {
//   public async up(queryRunner: QueryRunner): Promise<void> {
//     const modules = [
//       'products',
//       'suppliers',
//       'stocks',
//       'purchase_orders',
//       'users',
//       'companies',
//       'audit_logs',
//     ];

//     const actions = ['create', 'read', 'update', 'delete'];

//     const permissions = [];

//     for (const module of modules) {
//       for (const action of actions) {
//         permissions.push({
//           id: randomUUID(),
//           name: `${module}.${action}`,
//           description: `${action} ${module}`,
//         });
//       }
//     }

//     permissions.push(
//       {
//         id: randomUUID(),
//         name: 'purchase_orders.approve',
//         description: 'Approve purchase orders',
//       },
//       {
//         id: randomUUID(),
//         name: 'stocks.adjust',
//         description: 'Adjust stock quantities',
//       },
//     );

//     await queryRunner.manager
//       .createQueryBuilder()
//       .insert()
//       .into('permissions')
//       .values(permissions)
//       .execute();
//   }

//   public async down(queryRunner: QueryRunner): Promise<void> {
//     await queryRunner.query(`
//       DELETE FROM permissions
//     `);
//   }
// }
