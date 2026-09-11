import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { Product } from '../products/entities/product.entity';
import { AdjustStockDto, MutationType, Stocks } from './entities/stock.entity';

import { DashboardCard } from '../dashboard/interfaces/initial_interface';

import {
  ApiResponse,
  successResponse,
} from '../../common/utils/response.utils';
import {
  PaginationMeta,
  STOCK_SORT_FIELDS,
  StockPaginationQueryDto,
} from '../../common/dto/pagination-query.dto';
import { getPaginationOptions } from '../../common/utils/helpers/get_pagination_options.util';

@Injectable()
export class StocksService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,

    @InjectRepository(Stocks)
    private readonly stockRepository: Repository<Stocks>,

    private readonly dataSource: DataSource,
  ) {}

  /**
   * ─────────────────────────────────────────────
   * ADJUST SINGLE STOCK
   * ─────────────────────────────────────────────
   */
  /**
   * ─────────────────────────────────────────────
   * ADJUST SINGLE STOCK
   * ─────────────────────────────────────────────
   */
  async adjustStock(
    businessId: string,
    storeId: string,
    dto: AdjustStockDto,
  ): Promise<ApiResponse<Product>> {
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
        where: {
          id: dto.product_id,
          business_id: businessId,
        },
      });

      if (!product) {
        throw new NotFoundException('Product not found.');
      }

      const mutationQuantity = Number(dto.quantity);

      if (
        dto.type === MutationType.OUTFLOW &&
        product.stock_quantity < mutationQuantity
      ) {
        throw new BadRequestException(
          `Insufficient inventory. Available: ${product.stock_quantity}`,
        );
      }

      if (dto.type === MutationType.INFLOW) {
        product.stock_quantity += mutationQuantity;
      } else {
        product.stock_quantity -= mutationQuantity;
      }

      const updatedProduct = await queryRunner.manager.save(Product, product);

      const mutation = queryRunner.manager.create(Stocks, {
        product_id: product.id,
        business_id: businessId,
        store_id: storeId,
        type: dto.type,
        reason: dto.reason,
        quantity: mutationQuantity,
        unit_cost_price: product.cost_price,
        unit_selling_price: product.selling_price,
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
   * ─────────────────────────────────────────────
   * BULK ADJUST STOCK
   * ─────────────────────────────────────────────
   */
  async bulkAdjustStock(
    businessId: string,
    storeId: string,
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
          where: {
            id: dto.product_id,
            business_id: businessId,
          },
        });

        if (!product) {
          throw new NotFoundException(`Product ${dto.product_id} not found.`);
        }

        const mutationQuantity = Number(dto.quantity);

        if (
          dto.type === MutationType.OUTFLOW &&
          product.stock_quantity < mutationQuantity
        ) {
          throw new BadRequestException(
            `Insufficient stock for product ${product.id}. Available: ${product.stock_quantity}`,
          );
        }

        if (dto.type === MutationType.INFLOW) {
          product.stock_quantity += mutationQuantity;
        } else {
          product.stock_quantity -= mutationQuantity;
        }

        const updatedProduct = await queryRunner.manager.save(Product, product);

        updatedProducts.push(updatedProduct);

        const mutation = queryRunner.manager.create(Stocks, {
          product_id: product.id,
          business_id: businessId,
          store_id: storeId,
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
   * ─────────────────────────────────────────────
   * GET ALL STOCK RECORDS
   * ─────────────────────────────────────────────
   */
  async findAll(
    businessId: string,
    paginationQuery: StockPaginationQueryDto,
  ): Promise<
    ApiResponse<{
      stocks: Stocks[];
      meta: PaginationMeta;
    }>
  > {
    const {
      page: pageNumber,
      limit: limitNumber,
      skip,
    } = getPaginationOptions(paginationQuery);

    const {
      search,
      order = 'DESC',
      sortBy = 'created_at',
      type,
      product_id,
      store_id,
    } = paginationQuery;

    const sortColumn =
      STOCK_SORT_FIELDS[sortBy] ?? STOCK_SORT_FIELDS.created_at;

    const sortOrder: 'ASC' | 'DESC' =
      order?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const queryBuilder = this.stockRepository
      .createQueryBuilder('stock')
      .leftJoinAndSelect('stock.product', 'product')
      .leftJoinAndSelect('stock.store', 'store')
      .leftJoinAndSelect('stock.business', 'business')
      .where('stock.business_id = :businessId', {
        businessId,
      });

    /**
     * Search
     *
     * Search by product name, SKU or stock reason/type.
     */
    if (search) {
      queryBuilder.andWhere(
        `
        (
          LOWER(product.name) LIKE LOWER(:search)
          OR LOWER(product.sku) LIKE LOWER(:search)
          OR LOWER(stock.reason) LIKE LOWER(:search)
          OR LOWER(stock.type) LIKE LOWER(:search)
        )
        `,
        {
          search: `%${search}%`,
        },
      );
    }

    /**
     * Filter by mutation type
     */
    if (type) {
      queryBuilder.andWhere('stock.type = :type', {
        type,
      });
    }

    /**
     * Filter by product
     */
    if (product_id) {
      queryBuilder.andWhere('stock.product_id = :product_id', {
        product_id,
      });
    }

    /**
     * Filter by store
     */
    if (store_id) {
      queryBuilder.andWhere('stock.store_id = :store_id', {
        store_id,
      });
    }

    queryBuilder.orderBy(sortColumn, sortOrder).skip(skip).take(limitNumber);

    const [stocks, totalItems] = await queryBuilder.getManyAndCount();

    const totalPages = Math.ceil(totalItems / limitNumber);

    return successResponse('Stocks retrieved successfully', {
      stocks,
      meta: {
        totalItems,
        itemCount: stocks.length,
        itemsPerPage: limitNumber,
        totalPages,
        currentPage: pageNumber,
        hasNextPage: pageNumber < totalPages,
        hasPreviousPage: pageNumber > 1,
      },
    });
  }

  /**
   * ─────────────────────────────────────────────
   * GET SINGLE STOCK RECORD
   * ─────────────────────────────────────────────
   */
  async findOne(id: string, businessId: string): Promise<ApiResponse<Stocks>> {
    const stock = await this.stockRepository
      .createQueryBuilder('stock')
      .leftJoinAndSelect('stock.product', 'product')
      .leftJoinAndSelect('stock.store', 'store')
      .leftJoinAndSelect('stock.business', 'business')
      .where('stock.id = :id', {
        id,
      })
      .andWhere('stock.business_id = :businessId', {
        businessId,
      })
      .getOne();

    if (!stock) {
      throw new NotFoundException('Stock record not found');
    }

    return successResponse('Stock record retrieved successfully', stock);
  }

  /**
   * ─────────────────────────────────────────────
   * GET STOCK HISTORY FOR A PRODUCT
   * ─────────────────────────────────────────────
   */
  async findProductStockHistory(
    productId: string,
    businessId: string,
  ): Promise<ApiResponse<Stocks[]>> {
    const stocks = await this.stockRepository
      .createQueryBuilder('stock')
      .leftJoinAndSelect('stock.product', 'product')
      .leftJoinAndSelect('stock.store', 'store')
      .where('stock.product_id = :productId', {
        productId,
      })
      .andWhere('stock.business_id = :businessId', {
        businessId,
      })
      .orderBy('stock.created_at', 'DESC')
      .getMany();

    return successResponse(
      'Product stock history retrieved successfully',
      stocks,
    );
  }

  /**
   * ─────────────────────────────────────────────
   * GET CURRENT STOCK FOR A PRODUCT
   * ─────────────────────────────────────────────
   */
  async findCurrentStock(
    productId: string,
    businessId: string,
  ): Promise<ApiResponse<Product>> {
    const product = await this.productRepository.findOne({
      where: {
        id: productId,
        business_id: businessId,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return successResponse(
      'Current product stock retrieved successfully',
      product,
    );
  }

  /**
   * ─────────────────────────────────────────────
   * WAREHOUSE METRICS
   * ─────────────────────────────────────────────
   */
  async getWarehouseMetrics(businessId: string): Promise<DashboardCard[]> {
    const result = await this.productRepository
      .createQueryBuilder('product')
      .select('COALESCE(SUM(product.stock_quantity), 0)', 'totalStock')
      .addSelect(
        `
        SUM(
          CASE
            WHEN product.stock_quantity <= product.reorder_level
            THEN 1
            ELSE 0
          END
        )
        `,
        'lowStock',
      )
      .addSelect(
        `
        SUM(
          CASE
            WHEN product.stock_quantity = 0
            THEN 1
            ELSE 0
          END
        )
        `,
        'outOfStock',
      )
      .where('product.business_id = :businessId', {
        businessId,
      })
      .getRawOne<{
        totalStock: string;
        lowStock: string;
        outOfStock: string;
      }>();

    return [
      {
        id: 'total-stock',
        title: 'Total Stock',
        value: Number(result?.totalStock ?? 0),
        severity: 'success',
      },
      {
        id: 'low-stock',
        title: 'Low Stock',
        value: Number(result?.lowStock ?? 0),
        severity: Number(result?.lowStock ?? 0) > 0 ? 'warning' : 'success',
      },
      {
        id: 'out-of-stock',
        title: 'Out of Stock',
        value: Number(result?.outOfStock ?? 0),
        severity: Number(result?.outOfStock ?? 0) > 0 ? 'danger' : 'success',
      },
    ];
  }
}
