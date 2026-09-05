import { randomUUID } from 'crypto';
import { MigrationInterface, QueryRunner } from 'typeorm';

import { Role } from '../../auth/entities/role.entity';
import { Permission } from '../../auth/entities/permission.entity';
import { UserAuth } from '../../auth/entities/user_auth.entity';
import { User } from '../../resources/users/entities/user.entity';
import { UserRole } from '../../common/enum/user_role.enum';
import { passwordHasher } from '../../common/utils/helpers/password_hasher';
import { BusinessIdRow } from '../../auth/interfaces/index.interface';

export class InitialSeeding1785451531000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    /**
     * ============================================================
     * 1. BUSINESS
     * ============================================================
     */

    const businessId = randomUUID();

    await queryRunner.query(
      `
      INSERT INTO businesses (
        id,
        legal_name,
        display_name,
        slug,
        business_type,
        email,
        phone_number,
        country,
        currency,
        timezone,
        locale
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        businessId,
        'SwiftBuy Demo Business',
        'SwiftBuy Demo',
        'swiftbuy-demo',
        'RETAIL',
        'admin@swiftbuy.com',
        '+2348000000000',
        'NG',
        'NGN',
        'Africa/Lagos',
        'en-NG',
      ],
    );

    /**
     * ============================================================
     * 2. DEFAULT STORE
     * ============================================================
     */

    const storeId = randomUUID();

    await queryRunner.query(
      `
      INSERT INTO stores (
        id,
        business_id,
        name,
        code,
        country
      )
      VALUES (?, ?, ?, ?, ?)
      `,
      [storeId, businessId, 'Main Store', 'MAIN', 'NG'],
    );

    /**
     * ============================================================
     * 3. PERMISSIONS
     * ============================================================
     */

    const permissionRepository = queryRunner.manager.getRepository(Permission);

    const modules = [
      'products',
      'categories',
      'suppliers',
      'stocks',
      'stock_movements',
      'purchase_orders',
      'users',
      'businesses',
      'audit_logs',
    ];

    const actions = ['create', 'read', 'update', 'delete'];

    const permissionDefinitions = modules.flatMap((module) =>
      actions.map((action) => ({
        name: `${module}.${action}`,
        description: `${action} ${module}`,
      })),
    );

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

    const permissions: Permission[] = [];

    for (const definition of permissionDefinitions) {
      const permission = permissionRepository.create(definition);

      permissions.push(await permissionRepository.save(permission));
    }

    /**
     * ============================================================
     * 4. ROLES
     * ============================================================
     */

    const roleRepository = queryRunner.manager.getRepository(Role);

    const roleDefinitions = [
      {
        name: UserRole.SUPER_ADMIN,
        description: 'System administrator',
      },
      {
        name: UserRole.ADMIN,
        description: 'Business owner or administrator',
      },
      {
        name: UserRole.MANAGER,
        description: 'Store or warehouse manager',
      },
      {
        name: UserRole.STOREMAN,
        description: 'Store operator',
      },
      {
        name: UserRole.CASHIER,
        description: 'Sales cashier',
      },
    ];

    const roles: Role[] = [];

    for (const definition of roleDefinitions) {
      const role = roleRepository.create(definition);

      roles.push(await roleRepository.save(role));
    }

    /**
     * ============================================================
     * 5. ADMIN ROLE
     * ============================================================
     *
     * For the bootstrap account, ADMIN receives all permissions.
     */

    const adminRole = roles.find((role) => role.name === UserRole.ADMIN);

    if (!adminRole) {
      throw new Error('ADMIN role was not created');
    }

    await queryRunner.manager
      .createQueryBuilder()
      .insert()
      .into('role_permissions')
      .values(
        permissions.map((permission) => ({
          role_id: adminRole.id,
          permission_id: permission.id,
        })),
      )
      .execute();

    /**
     * ============================================================
     * 6. FIRST USER
     * ============================================================
     */

    const userRepository = queryRunner.manager.getRepository(User);

    const adminUser = userRepository.create({
      business_id: businessId,
      store_id: storeId,
      first_name: 'SwiftBuy',
      last_name: 'Admin',
      business_email: 'admin@swiftbuy.com',
      role_id: adminRole.id,
      is_active: true,
    });

    const savedAdmin = await userRepository.save(adminUser);

    /**
     * ============================================================
     * 7. USER AUTHENTICATION
     * ============================================================
     *
     * Development credentials:
     *
     * Email:    admin@swiftbuy.com
     * Password: Test@123!#
     *
     * Change this before using this seed outside development.
     */

    const userAuthRepository = queryRunner.manager.getRepository(UserAuth);

    const password: string = await passwordHasher('Test@123!#');

    const userAuth = userAuthRepository.create({
      user_id: savedAdmin.id,
      password,
      is_email_verified: true,
    });

    await userAuthRepository.save(userAuth);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    /**
     * Business deletion cascades into:
     *
     * stores
     * users
     * user_auth
     * categories
     * products
     * suppliers
     * product_sources
     * stocks
     * stock_movements
     * purchase_orders
     * audit_logs
     */

    const result: unknown = await queryRunner.query(
      ` SELECT b.id FROM businesses b INNER JOIN users u ON u.business_id = b.id WHERE u.business_email = ? LIMIT 1 `,
      ['admin@swiftbuy.com'],
    );

    const businesses = result as BusinessIdRow[];

    if (businesses.length > 0) {
      await queryRunner.query(
        `
        DELETE FROM businesses
        WHERE id = ?
        `,
        [businesses[0].id],
      );
    }

    /**
     * role_permissions must be removed before roles/permissions.
     */

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
         OR name LIKE 'categories.%'
         OR name LIKE 'suppliers.%'
         OR name LIKE 'stocks.%'
         OR name LIKE 'stock_movements.%'
         OR name LIKE 'purchase_orders.%'
         OR name LIKE 'users.%'
         OR name LIKE 'businesses.%'
         OR name LIKE 'audit_logs.%'
    `);
  }
}
