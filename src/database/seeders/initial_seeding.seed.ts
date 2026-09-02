import { MigrationInterface, QueryRunner } from 'typeorm';

import { User } from '../../resources/users/entities/user.entity';
import { Role } from '../../auth/entities/role.entity';
import { UserRole } from '../../common/enum/user_role.enum';
import { Permission } from '../../auth/entities/permission.entity';
import { UserAuth } from '../../auth/entities/user_auth.entity';
import { passwordHasher } from '../../utils/helpers/password_hasher';
import { faker } from '@faker-js/faker';

import {
  MutationReason,
  MutationType,
  Stocks,
} from '../../resources/stocks/entities/stock.entity';
import {
  Product,
  UomBaseName,
  UomDisplayName,
  UomType,
} from '../../resources/products/entities/product.entity';
import convertToIntegerBaseUnit from '../../utils/helpers/cloudinary/convertToBaseInteger';

export class InitialSeeding1785451531000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    /**
     * ============================================================
     * 1. SEED PERMISSIONS
     * ============================================================
     */

    // const permissionRepository = queryRunner.manager.getRepository(Permission);

    // const modules = [
    //   'products',
    //   'suppliers',
    //   'stocks',
    //   'purchase_orders',
    //   'users',
    //   'businesses',
    //   'audit_logs',
    // ];

    // const actions = ['create', 'read', 'update', 'delete'];

    // const permissionDefinitions: {
    //   name: string;
    //   description: string;
    // }[] = [];

    // for (const module of modules) {
    //   for (const action of actions) {
    //     permissionDefinitions.push({
    //       name: `${module}.${action}`,
    //       description: `${action} ${module}`,
    //     });
    //   }
    // }

    // permissionDefinitions.push(
    //   {
    //     name: 'purchase_orders.approve',
    //     description: 'Approve purchase orders',
    //   },
    //   {
    //     name: 'stocks.adjust',
    //     description: 'Adjust stock quantities',
    //   },
    // );

    // for (const permissionDefinition of permissionDefinitions) {
    //   const existingPermission = await permissionRepository.findOne({
    //     where: {
    //       name: permissionDefinition.name,
    //     },
    //   });

    //   if (existingPermission) {
    //     continue;
    //   }

    //   const permission = permissionRepository.create({
    //     name: permissionDefinition.name,
    //     description: permissionDefinition.description,
    //   });

    //   await permissionRepository.save(permission);
    // }

    /**
     * ============================================================
     * 2. SEED ROLES
     * ============================================================
     */

    // const roleRepository = queryRunner.manager.getRepository(Role);

    // const roles = [
    //   {
    //     name: UserRole.SUPER_ADMIN,
    //     description: 'System administrator',
    //   },
    //   {
    //     name: UserRole.ADMIN,
    //     description: 'Business owner',
    //   },
    //   {
    //     name: UserRole.MANAGER,
    //     description: 'Warehouse or branch manager',
    //   },
    //   {
    //     name: UserRole.STOREMAN,
    //     description: 'Warehouse/store operator',
    //   },
    //   {
    //     name: UserRole.CASHIER,
    //     description: 'Sales cashier',
    //   },
    // ];

    // await roleRepository
    //   .createQueryBuilder()
    //   .insert()
    //   .into(Role)
    //   .values(
    //     roles.map((role) => ({
    //       name: role.name,
    //       description: role.description,
    //     })),
    //   )
    //   .orIgnore() // Ignores insertion if unique constraint on `name` fails
    //   .execute();

    /**
     * ============================================================
     * 3. SEED ROLE PERMISSIONS
     * ============================================================
     */

    // const allPermissions = await permissionRepository.find();
    // const adminRole = await roleRepository.findOne({
    //   where: { name: UserRole.SUPER_ADMIN },
    // });

    // if (adminRole) {
    //   // ✅ Clean, driver-agnostic way to attach permissions to a role
    //   adminRole.permissions = allPermissions;
    //   await roleRepository.save(adminRole);
    // }

    /**
     * ============================================================
     * 5. SEED PRODUCTS & INITIAL STOCK LEDGER
     * ============================================================
     */
    const productRepository = queryRunner.manager.getRepository(Product);
    const stockRepository = queryRunner.manager.getRepository(Stocks);

    const generateStockQuantity = (): number => {
      return faker.helpers.weightedArrayElement([
        { value: 0, weight: 10 }, // 10% out of stock
        {
          value: faker.number.int({ min: 1, max: 10 }),
          weight: 15,
        },
        {
          value: faker.number.int({ min: 11, max: 50 }),
          weight: 25,
        },
        {
          value: faker.number.int({ min: 51, max: 500 }),
          weight: 50,
        },
      ]);
    };

    const generateProductSeed = () => {
      const uomType = faker.helpers.arrayElement([
        UomType.UNIT,
        UomType.WEIGHT,
        UomType.VOLUME,
      ]);

      const reorderLevel = faker.number.int({
        min: 5,
        max: 50,
      });

      const costPrice = Number(
        faker.commerce.price({
          min: 5,
          max: 500,
          dec: 2,
        }),
      );

      const sellingPrice = Number(
        faker.commerce.price({
          min: costPrice * 1.2,
          max: costPrice * 2,
          dec: 2,
        }),
      );

      const uomConfig =
        uomType === UomType.UNIT
          ? {
              uom_base_name: UomBaseName.PCS,
              uom_display_name: UomDisplayName.PCS,
            }
          : uomType === UomType.WEIGHT
            ? {
                uom_base_name: UomBaseName.G,
                uom_display_name: UomDisplayName.KG,
              }
            : {
                uom_base_name: UomBaseName.ML,
                uom_display_name: UomDisplayName.L,
              };

      return {
        name: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        cost_price: costPrice,
        selling_price: sellingPrice,
        stock_quantity: generateStockQuantity(),
        reorder_level: reorderLevel,
        uom_type: uomType,
        ...uomConfig,
        images: [],
      };
    };

    const productSeeds = Array.from({ length: 1200 }, generateProductSeed);

    if (productSeeds.length > 0) {
      /**
       * Create products.
       *
       * Stock quantity is deliberately NOT passed here because
       * stock management owns the product's stock quantity.
       */
      const productEntities = productSeeds.map((seed) => {
        const reorderLevelBase = convertToIntegerBaseUnit(
          seed.reorder_level,
          seed.uom_display_name,
        );

        return productRepository.create({
          name: seed.name,
          description: seed.description,
          selling_price: seed.selling_price,
          cost_price: seed.cost_price,
          images: seed.images,
          reorder_level: reorderLevelBase,
          // Initial quantity will be determined by stock management.
          stock_quantity: seed.stock_quantity,
          uom_type: seed.uom_type,
          uom_base_name: seed.uom_base_name,
          uom_display_name: seed.uom_display_name,
        });
      });

      /**
       * Bulk save products.
       */
      const savedProducts = await productRepository.save(productEntities);

      /**
       * Create the initial stock mutations.
       *
       * The index keeps each generated stock quantity associated
       * with the corresponding saved product.
       */
      const stockMutations = savedProducts.map((product, index) =>
        stockRepository.create({
          product_id: product.id,
          type: MutationType.INFLOW,
          reason: MutationReason.NEW_PRODUCT_INITIALIZATION,

          // Each product gets its own random quantity.
          quantity: productSeeds[index].stock_quantity,

          unit_cost_price: product.cost_price,
          unit_selling_price: product.selling_price,
        }),
      );
      await stockRepository.save(stockMutations);
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
