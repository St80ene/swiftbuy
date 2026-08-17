// import { MigrationInterface, QueryRunner } from 'typeorm';

// export class SeedRolePermissions1785451535000 implements MigrationInterface {
//   public async up(queryRunner: QueryRunner): Promise<void> {
//     const roles = await queryRunner.query(`
//       SELECT id, name
//       FROM roles
//     `);

//     const permissions = await queryRunner.query(`
//       SELECT id, name
//       FROM permissions
//     `);

//     const roleMap = new Map<string, string>();
//     const permissionMap = new Map<string, string>();

//     for (const role of roles) {
//       roleMap.set(role.name, role.id);
//     }

//     for (const permission of permissions) {
//       permissionMap.set(permission.name, permission.id);
//     }

//     const getPermissions = (names: string[]) =>
//       names.map((name) => permissionMap.get(name)).filter(Boolean) as string[];

//     const allPermissions = [...permissionMap.values()];

//     const managerPermissions = getPermissions([
//       'products.create',
//       'products.read',
//       'products.update',

//       'suppliers.create',
//       'suppliers.read',
//       'suppliers.update',

//       'stocks.create',
//       'stocks.read',
//       'stocks.update',
//       'stocks.adjust',

//       'purchase_orders.create',
//       'purchase_orders.read',
//       'purchase_orders.update',
//       'purchase_orders.approve',
//     ]);

//     const storemanPermissions = getPermissions([
//       'products.read',

//       'stocks.read',
//       'stocks.update',
//       'stocks.adjust',

//       'purchase_orders.read',
//       'purchase_orders.update',
//     ]);

//     const cashierPermissions = getPermissions(['products.read', 'stocks.read']);

//     const mappings = [
//       {
//         role: 'SUPER_ADMIN',
//         permissions: allPermissions,
//       },
//       {
//         role: 'ADMIN',
//         permissions: allPermissions,
//       },
//       {
//         role: 'MANAGER',
//         permissions: managerPermissions,
//       },
//       {
//         role: 'STOREMAN',
//         permissions: storemanPermissions,
//       },
//       {
//         role: 'CASHIER',
//         permissions: cashierPermissions,
//       },
//     ];

//     const rows: {
//       role_id: string;
//       permission_id: string;
//       created_at: Date;
//     }[] = [];

//     for (const mapping of mappings) {
//       const roleId = roleMap.get(mapping.role);

//       if (!roleId) continue;

//       for (const permissionId of mapping.permissions) {
//         rows.push({
//           role_id: roleId,
//           permission_id: permissionId,
//           created_at: new Date(),
//         });
//       }
//     }

//     if (rows.length) {
//       await queryRunner
//         .createQueryBuilder()
//         .insert()
//         .into('role_permissions')
//         .values(rows)
//         .execute();
//     }
//   }

//   public async down(queryRunner: QueryRunner): Promise<void> {
//     await queryRunner.query(`
//       DELETE FROM role_permissions
//     `);
//   }
// }
