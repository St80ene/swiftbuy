import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Product } from '../products/entities/product.entity';

import { Stock } from './entities/stock.entity';

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
import { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface';

@Injectable()
export class StocksService {
  constructor(
    @InjectRepository(Product)
    @InjectRepository(Stock)
    private readonly stockRepository: Repository<Stock>,
  ) {}

  /**
   * Retrieves current stock balances.
   *
   * This queries Stock, not StockMovement.
   */
  async findAll(
    user: AuthenticatedUser,
    paginationQuery: StockPaginationQueryDto,
  ): Promise<
    ApiResponse<{
      stocks: Stock[];
      meta: PaginationMeta;
    }>
  > {
    const { businessId, storeId } = user;
    const {
      page: pageNumber,
      limit: limitNumber,
      skip,
    } = getPaginationOptions(paginationQuery);

    const {
      search,
      order = 'DESC',
      sortBy = 'updated_at',
      product_id,
      store_id,
    } = paginationQuery;

    const sortColumn =
      STOCK_SORT_FIELDS[sortBy] ?? STOCK_SORT_FIELDS.updated_at;

    const sortOrder: 'ASC' | 'DESC' =
      order?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const queryBuilder = this.stockRepository
      .createQueryBuilder('stock')
      .leftJoinAndSelect('stock.product', 'product')
      .leftJoinAndSelect('stock.store', 'store')
      .where('stock.business_id = :businessId', {
        businessId: businessId,
      });

    if (user.storeId) {
      queryBuilder.andWhere('stock.store_id = :currentStoreId', {
        currentStoreId: storeId,
      });
    }

    if (search) {
      queryBuilder.andWhere(
        `
        (
          LOWER(product.name) LIKE LOWER(:search)
        )
        `,
        {
          search: `%${search}%`,
        },
      );
    }

    if (product_id) {
      queryBuilder.andWhere('stock.product_id = :productId', {
        productId: product_id,
      });
    }

    /**
     * A store filter may be supplied for business-wide users.
     * Store-assigned users are restricted to their own store.
     */
    if (store_id) {
      if (user.storeId && store_id !== user.storeId) {
        throw new BadRequestException(
          'You cannot access stock belonging to another store.',
        );
      }

      queryBuilder.andWhere('stock.store_id = :storeId', {
        storeId: store_id,
      });
    }

    queryBuilder.orderBy(sortColumn, sortOrder).skip(skip).take(limitNumber);

    const [stocks, totalItems] = await queryBuilder.getManyAndCount();

    const totalPages = Math.ceil(totalItems / limitNumber);

    return successResponse('Stock balances retrieved successfully', {
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
   * Retrieves one current stock balance.
   */
  async findOne(
    id: string,
    user: AuthenticatedUser,
  ): Promise<ApiResponse<Stock>> {
    const { businessId, storeId } = user;

    const stock = this.stockRepository
      .createQueryBuilder('stock')
      .leftJoinAndSelect('stock.product', 'product')
      .leftJoinAndSelect('stock.store', 'store')
      .where('stock.id = :id', { id })
      .andWhere('stock.business_id = :businessId', {
        businessId: businessId,
      });

    if (storeId) {
      stock.andWhere('stock.store_id = :storeId', {
        storeId: storeId,
      });
    }

    const stockRecord = await stock.getOne();

    if (!stockRecord) {
      throw new NotFoundException('Stock balance not found.');
    }

    return successResponse('Stock balance retrieved successfully', stockRecord);
  }

  /**
   * Returns warehouse/inventory metrics.
   */
  async getWarehouseMetrics(user: AuthenticatedUser): Promise<DashboardCard[]> {
    const { businessId, storeId } = user;

    const queryBuilder = this.stockRepository
      .createQueryBuilder('stock')
      .innerJoin('stock.product', 'product')
      .where('stock.business_id = :businessId', {
        businessId,
      })
      .andWhere('product.deleted_at IS NULL');

    if (storeId) {
      queryBuilder.andWhere('stock.store_id = :storeId', {
        storeId,
      });
    }

    const result = await queryBuilder
      .select('COALESCE(SUM(stock.quantity), 0)', 'totalStock')
      .addSelect(
        `
        COALESCE(
          SUM(
            CASE
              WHEN stock.quantity <= stock.reorder_level
              THEN 1
              ELSE 0
            END
          ),
          0
        )
        `,
        'lowStock',
      )
      .addSelect(
        `
        COALESCE(
          SUM(
            CASE
              WHEN stock.quantity = 0
              THEN 1
              ELSE 0
            END
          ),
          0
        )
        `,
        'outOfStock',
      )
      .addSelect(
        `
        COALESCE(
          SUM(stock.quantity * product.cost_price),
          0
        )
        `,
        'inventoryValue',
      )
      .getRawOne<{
        totalStock: string;
        lowStock: string;
        outOfStock: string;
        inventoryValue: string;
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
