import { MigrationInterface, QueryRunner } from 'typeorm';
import { randomUUID } from 'crypto';

import { User } from '../../resources/users/entities/user.entity';
import { Role } from '../../auth/entities/role.entity';
import { UserRole } from '../../enum/user_role.enum';
import { Permission } from '../../auth/entities/permission.entity';
import { UserAuth } from '../../auth/entities/user_auth.entity';
import { passwordHasher } from '../../utils/helpers/password_hasher';

export class InitialSeeding1785451531000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    /**
     * ============================================================
     * 1. SEED PERMISSIONS
     * ============================================================
     */

    const permissionRepository = queryRunner.manager.getRepository(Permission);

    const modules = [
      'products',
      'suppliers',
      'stocks',
      'purchase_orders',
      'users',
      'businesses',
      'audit_logs',
    ];

    const actions = ['create', 'read', 'update', 'delete'];

    const permissionDefinitions: {
      name: string;
      description: string;
    }[] = [];

    for (const module of modules) {
      for (const action of actions) {
        permissionDefinitions.push({
          name: `${module}.${action}`,
          description: `${action} ${module}`,
        });
      }
    }

    permissionDefinitions.push(
      {
        name: 'purchase_orders.approve',
        description: 'Approve purchase orders',
      },
      {
        name: 'stocks.adjust',
        description: 'Adjust stock quantities',
      },
    );

    for (const permissionDefinition of permissionDefinitions) {
      const existingPermission = await permissionRepository.findOne({
        where: {
          name: permissionDefinition.name,
        },
      });

      if (existingPermission) {
        continue;
      }

      const permission = permissionRepository.create({
        id: randomUUID(),
        name: permissionDefinition.name,
        description: permissionDefinition.description,
      });

      await permissionRepository.save(permission);
    }

    /**
     * ============================================================
     * 2. SEED ROLES
     * ============================================================
     */

    const roleRepository = queryRunner.manager.getRepository(Role);

    const roles = [
      {
        name: UserRole.SUPER_ADMIN,
        description: 'System administrator',
      },
      {
        name: UserRole.ADMIN,
        description: 'Business owner',
      },
      {
        name: UserRole.MANAGER,
        description: 'Warehouse or branch manager',
      },
      {
        name: UserRole.STOREMAN,
        description: 'Warehouse/store operator',
      },
      {
        name: UserRole.CASHIER,
        description: 'Sales cashier',
      },
    ];

    await roleRepository
      .createQueryBuilder()
      .insert()
      .into(Role)
      .values(
        roles.map((role) => ({
          id: randomUUID(),
          name: role.name,
          description: role.description,
        })),
      )
      .orIgnore() // Ignores insertion if unique constraint on `name` fails
      .execute();

    /**
     * ============================================================
     * 3. SEED ROLE PERMISSIONS
     * ============================================================
     */

    const rolePermissions =
      queryRunner.manager.getRepository('role_permissions');

    const savedRoles = await roleRepository.find();
    const savedPermissions = await permissionRepository.find();

    const roleMap = new Map(savedRoles.map((role) => [role.name, role.id]));

    const permissionMap = new Map(
      savedPermissions.map((permission) => [permission.name, permission.id]),
    );

    const getPermissions = (names: string[]): string[] => {
      const permissions: string[] = [];

      for (const name of names) {
        const id = permissionMap.get(name);
        if (id) permissions.push(id);
      }

      return permissions;
    };

    const allPermissions = savedPermissions.map((permission) => permission.id);

    const managerPermissions = getPermissions([
      'products.create',
      'products.read',
      'products.update',

      'suppliers.create',
      'suppliers.read',
      'suppliers.update',

      'stocks.create',
      'stocks.read',
      'stocks.update',
      'stocks.adjust',

      'purchase_orders.create',
      'purchase_orders.read',
      'purchase_orders.update',
      'purchase_orders.approve',
    ]);

    const storemanPermissions = getPermissions([
      'products.read',

      'stocks.read',
      'stocks.update',
      'stocks.adjust',

      'purchase_orders.read',
      'purchase_orders.update',
    ]);

    const cashierPermissions = getPermissions(['products.read', 'stocks.read']);

    const mappings = [
      {
        role: UserRole.SUPER_ADMIN,
        permissions: allPermissions,
      },
      {
        role: UserRole.ADMIN,
        permissions: allPermissions,
      },
      {
        role: UserRole.MANAGER,
        permissions: managerPermissions,
      },
      {
        role: UserRole.STOREMAN,
        permissions: storemanPermissions,
      },
      {
        role: UserRole.CASHIER,
        permissions: cashierPermissions,
      },
    ];

    for (const mapping of mappings) {
      const roleId = roleMap.get(mapping.role);

      if (!roleId) {
        throw new Error(`Role "${mapping.role}" was not found.`);
      }

      for (const permissionId of mapping.permissions) {
        const existingMapping = await rolePermissions.findOne({
          where: {
            role_id: roleId,
            permission_id: permissionId,
          },
        });

        if (existingMapping) {
          continue;
        }

        await rolePermissions.insert({
          id: randomUUID(),
          role_id: roleId,
          permission_id: permissionId,
          created_at: new Date(),
        });
      }
    }

    /**
     * ============================================================
     * 4. CREATE SUPER ADMIN USER
     * ============================================================
     */

    const userRepository = queryRunner.manager.getRepository(User);

    const superAdminRole = await roleRepository.findOne({
      where: {
        name: UserRole.SUPER_ADMIN,
      },
    });

    if (!superAdminRole) {
      throw new Error('SUPER_ADMIN role not found.');
    }

    const existingUser = await userRepository.findOne({
      where: {
        email: 'superadmin@swiftbuy.com',
      },
    });

    if (!existingUser) {
      const user = userRepository.create({
        id: randomUUID(),
        first_name: 'SwiftBuy',
        last_name: 'Owner',
        email: 'superadmin@swiftbuy.com',
        role: superAdminRole,
        is_active: true,
      });

      const savedUser = await userRepository.save(user);

      /**
       * ========================================================
       * 5. CREATE SUPER ADMIN AUTH
       * ========================================================
       */

      const userAuthRepository = queryRunner.manager.getRepository(UserAuth);

      const existingUserAuth = await userAuthRepository.findOne({
        where: {
          user_id: savedUser.id,
        },
      });

      if (!existingUserAuth) {
        const passwordHash = await passwordHasher('superadmin@123#');

        const userAuth = userAuthRepository.create({
          user_id: savedUser.id,
          password: passwordHash,
        });

        await userAuthRepository.save(userAuth);
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    /**
     * Delete in REVERSE dependency order.
     */

    const userRepository = queryRunner.manager.getRepository(User);
    const userAuthRepository = queryRunner.manager.getRepository(UserAuth);

    const superAdmin = await userRepository.findOne({
      where: {
        email: 'superadmin@swiftbuy.com',
      },
    });

    if (superAdmin) {
      await userAuthRepository.delete({
        user_id: superAdmin.id,
      });

      await userRepository.delete({
        id: superAdmin.id,
      });
    }

    await queryRunner.query(`
      DELETE FROM role_permissions
    `);

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

    await queryRunner.query(`
      DELETE FROM permissions
      WHERE name LIKE 'products.%'
         OR name LIKE 'suppliers.%'
         OR name LIKE 'stocks.%'
         OR name LIKE 'purchase_orders.%'
         OR name LIKE 'users.%'
         OR name LIKE 'businesses.%'
         OR name LIKE 'audit_logs.%'
    `);
  }
}
