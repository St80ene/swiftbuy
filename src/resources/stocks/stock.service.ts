import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Product } from '../products/entities/product.entity';
import { AdjustStockDto, MutationType, Stocks } from './entities/stock.entity';
import { ApiResponse, successResponse } from '../../utils/response.utils';
import { DataSource, FindOptionsWhere, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { DashboardCard } from '../dashboard/interfaces/initial_interface';

@Injectable()
export class StocksService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * ─── ADJUST STOCK VIA ATOMIC LEDGER TRANSACTION ───
   */
  async adjustStock(dto: AdjustStockDto): Promise<ApiResponse<Product>> {
    // extend this service method to handle array of products
    if (dto.quantity <= 0) {
      throw new BadRequestException(
        'Mutation quantity must be greater than zero.',
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const product = await queryRunner.manager.findOne(Product, {
        where: { id: dto.product_id },
      });

      if (!product) {
        throw new NotFoundException('Product not found.');
      }

      // Calculate parameters safely
      const mutationQuantity = Number(dto.quantity);
      if (
        dto.type === MutationType.OUTFLOW &&
        product.stock_quantity < mutationQuantity
      ) {
        throw new BadRequestException(
          `Insolvent inventory allocation. Available: ${product.stock_quantity}`,
        );
      }

      // Update product current balance
      if (dto.type === MutationType.INFLOW) {
        product.stock_quantity += mutationQuantity;
      } else {
        product.stock_quantity -= mutationQuantity;
      }
      const updatedProduct = await queryRunner.manager.save(Product, product);

      // Record tracking ledger log
      const mutation = queryRunner.manager.create(Stocks, {
        // 4. FIXED: Using correct Stock entity
        product_id: product.id,
        type: dto.type,
        reason: dto.reason,
        quantity: mutationQuantity,
        unit_cost_price: product.cost_price,
        unit_selling_price: product.selling_price, // 5. FIXED: price -> selling_price
      });
      await queryRunner.manager.save(Stocks, mutation);

      await queryRunner.commitTransaction();
      return successResponse(
        'Inventory stock ledger updated successfully',
        updatedProduct,
      );
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Transaction failed while processing stock change.',
      );
    } finally {
      await queryRunner.release();
    }
  }

  async bulkAdjustStock(
    dtoArray: AdjustStockDto[],
  ): Promise<ApiResponse<Product[]>> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const updatedProducts: Product[] = [];

      for (const dto of dtoArray) {
        if (dto.quantity <= 0) {
          throw new BadRequestException(
            'Mutation quantity must be greater than zero.',
          );
        }

        const product = await queryRunner.manager.findOne(Product, {
          where: { id: dto.product_id },
        });

        if (!product) {
          throw new NotFoundException(`Product not found.`);
        }

        const mutationQuantity = Number(dto.quantity);
        if (
          product.stock_quantity > 0 &&
          dto.type === MutationType.OUTFLOW &&
          product.stock_quantity < mutationQuantity
        ) {
          throw new BadRequestException(
            `Available stock balance: ${product.stock_quantity}`,
          );
        }

        // Update product current balance
        if (dto.type === MutationType.INFLOW) {
          product.stock_quantity += mutationQuantity;
        } else {
          product.stock_quantity -= mutationQuantity;
        }
        const updatedProduct = await queryRunner.manager.save(Product, product);
        updatedProducts.push(updatedProduct);

        // Record tracking ledger log
        const mutation = queryRunner.manager.create(Stocks, {
          product_id: product.id,
          type: dto.type,
          reason: dto.reason,
          quantity: mutationQuantity,
          unit_cost_price: product.cost_price,
          unit_selling_price: product.selling_price,
        });

        await queryRunner.manager.save(Stocks, mutation);
      }

      await queryRunner.commitTransaction();
      return successResponse(
        'Inventory stock ledger updated successfully for multiple products',
        updatedProducts,
      );
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Transaction failed while processing stock changes for multiple products.',
      );
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * ─── COMPILE HISTORY LEDGER TIMELINE ───
   */
  async getLedgerLogs(req?: AdjustStockDto): Promise<ApiResponse<Stocks[]>> {
    const whereCondition: FindOptionsWhere<Stocks> = { ...req };

    const logs = await this.dataSource.getRepository(Stocks).find({
      where: whereCondition,
      order: { createdAt: 'DESC' },
    });

    return successResponse(
      'Inventory historical timeline tracking logs compiled',
      logs,
    );
  }

  async getWarehouseMetrics(): Promise<DashboardCard[]> {
    const result: Record<string, any> | undefined = await this.productRepository
      .createQueryBuilder('product')
      .select('COALESCE(SUM(product.stockQuantity), 0)', 'totalStock')
      .addSelect(
        'SUM(CASE WHEN product.stockQuantity <= product.reorderLevel THEN 1 ELSE 0 END)',
        'lowStock',
      )
      .addSelect(
        'SUM(CASE WHEN product.stockQuantity = 0 THEN 1 ELSE 0 END)',
        'outOfStock',
      )
      .getRawOne<{
        totalStock: string;
        lowStock: string;
        outOfStock: string;
      }>();

    return [
      {
        id: 'total-stock',
        title: 'Total Stock',
        value: Number(result?.totalStock),
        severity: 'success',
      },
      {
        id: 'low-stock',
        title: 'Low Stock',
        value: Number(result?.lowStock),
        severity: Number(result?.lowStock) > 0 ? 'warning' : 'success',
      },
      {
        id: 'out-of-stock',
        title: 'Out of Stock',
        value: Number(result?.outOfStock),
        severity: Number(result?.outOfStock) > 0 ? 'danger' : 'success',
      },
    ];
  }
}
