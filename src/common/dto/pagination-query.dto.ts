import {
  IsOptional,
  IsInt,
  Min,
  Max,
  IsString,
  IsIn,
  IsEnum,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ProductStatus } from '../../resources/products/entities/product.entity';

export const NormalizeSearch = () =>
  Transform(({ value }: { value: unknown }) => {
    if (typeof value !== 'string') {
      return value;
    }

    const normalized = value.trim().replace(/\s+/g, ' ');

    return normalized || undefined;
  });

export const PRODUCT_SORT_FIELDS = {
  created_at: 'product.created_at',
  updated_at: 'product.updated_at',
  name: 'product.name',
  selling_price: 'product.selling_price',
  cost_price: 'product.cost_price',
  stock_quantity: 'product.stock_quantity',
} as const;

export type ProductSortField = (typeof PRODUCT_SORT_FIELD_NAMES)[number];

export const PRODUCT_SORT_FIELD_NAMES = [
  'created_at',
  'updated_at',
  'name',
  'selling_price',
  'cost_price',
  'stock_quantity',
] as const;

export class BasePaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  @NormalizeSearch()
  search?: string;

  [key: string]: unknown;
}

export class ProductPaginationQueryDto extends BasePaginationQueryDto {
  @IsOptional()
  @IsEnum(ProductStatus, {
    message:
      'Invalid product status. Must be one of: ACTIVE, INACTIVE, ARCHIVED.',
  })
  status?: ProductStatus;

  @IsOptional()
  @IsIn(Object.keys(PRODUCT_SORT_FIELDS))
  sortBy?: ProductSortField = 'created_at';

  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  order?: 'ASC' | 'DESC' = 'DESC';

  [key: string]: unknown;
}

export class PurchaseOrderPaginationQueryDto extends BasePaginationQueryDto {
  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  order?: 'ASC' | 'DESC' = 'DESC';

  @IsOptional()
  @IsIn(['DRAFT', 'APPROVED', 'RECEIVED', 'CANCELLED'])
  status?: string;

  @IsOptional()
  @IsString()
  approved_by_id?: string;

  @IsOptional()
  @IsString()
  supplier_name?: string;
}

export const AUDIT_LOG_SORT_FIELDS = {
  created_at: 'audit_log.created_at',
  updated_at: 'audit_log.updated_at',
} as const;

export const AUDIT_LOG_SORT_FIELD_NAMES = ['created_at', 'updated_at'] as const;

export type AuditLogSortField = (typeof AUDIT_LOG_SORT_FIELD_NAMES)[number];

export class AuditLogPaginationQueryDto extends BasePaginationQueryDto {
  @IsOptional()
  @IsIn(Object.keys(AUDIT_LOG_SORT_FIELDS))
  sortBy?: AuditLogSortField = 'created_at';

  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  order?: 'ASC' | 'DESC' = 'DESC';

  [key: string]: unknown;
}

export interface PaginationMeta {
  totalItems: number;
  itemCount: number;
  itemsPerPage: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export const STORE_SORT_FIELDS: Record<string, string> = {
  name: 'store.name',
  code: 'store.code',
  city: 'store.city',
  state: 'store.state',
  created_at: 'store.created_at',
  updated_at: 'store.updated_at',
} as const;

export type StoreSortField = (typeof STORE_SORT_FIELD_NAMES)[number];

export const STORE_SORT_FIELD_NAMES = Object.keys(STORE_SORT_FIELDS);
export class StorePaginationQueryDto extends BasePaginationQueryDto {
  @IsOptional()
  @IsIn(Object.keys(STORE_SORT_FIELDS))
  sortBy?: StoreSortField = 'created_at';

  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  order?: 'ASC' | 'DESC' = 'DESC';

  [key: string]: unknown;
}

export const STOCK_SORT_FIELDS: Record<string, string> = {
  created_at: 'stock.created_at',
  updated_at: 'stock.updated_at',
  quantity: 'stock.quantity',
  type: 'stock.type',
  reason: 'stock.reason',
  unit_cost_price: 'stock.unit_cost_price',
  unit_selling_price: 'stock.unit_selling_price',
} as const;

export const STOCK_SORT_FIELD_NAMES = Object.keys(STOCK_SORT_FIELDS);
export type StockSortField = (typeof STOCK_SORT_FIELD_NAMES)[number];
export class StockPaginationQueryDto extends BasePaginationQueryDto {
  @IsOptional()
  @IsIn(Object.keys(STOCK_SORT_FIELDS))
  sortBy?: StockSortField = 'created_at';

  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  order?: 'ASC' | 'DESC' = 'DESC';

  [key: string]: unknown;
}
