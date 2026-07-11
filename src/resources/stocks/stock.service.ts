import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Product } from '../products/entities/product.entity';
import { AdjustStockDto, MutationType, Stocks } from './entities/stock.entity';
import { ApiResponse, successResponse } from '../../utils/response.utils';
import { DataSource, FindOptionsWhere } from 'typeorm';

@Injectable()
export class StockService {
  constructor(private readonly dataSource: DataSource) {}

  /**
   * ─── ADJUST STOCK VIA ATOMIC LEDGER TRANSACTION ───
   */
  async adjustStock(dto: AdjustStockDto): Promise<ApiResponse<Product>> {
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

  /**
   * ─── COMPILE HISTORY LEDGER TIMELINE ───
   */
  async getLedgerLogs(productId?: string): Promise<ApiResponse<Stocks[]>> {
    const whereCondition: FindOptionsWhere<Stocks> = {};

    if (productId) whereCondition.product_id = productId;

    const logs = await this.dataSource.getRepository(Stocks).find({
      where: whereCondition,
      order: { createdAt: 'DESC' },
    });

    return successResponse(
      'Inventory historical timeline tracking logs compiled',
      logs,
    );
  }
}
