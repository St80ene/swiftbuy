import { IsOptional, IsInt, Min, Max, IsString, IsIn } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export const NormalizeSearch = () =>
  Transform(({ value }) => {
    if (typeof value !== 'string') {
      return value;
    }

    const normalized = value.trim().replace(/\s+/g, ' ');

    return normalized || undefined;
  });

export const PRODUCT_SORT_FIELDS = {
  createdAt: 'product.createdAt',
  updatedAt: 'product.updatedAt',
  name: 'product.name',
  selling_price: 'product.selling_price',
  cost_price: 'product.cost_price',
  stock_quantity: 'product.stock_quantity',
} as const;

export type ProductSortField = keyof typeof PRODUCT_SORT_FIELDS;

export const PRODUCT_SORT_FIELD_NAMES = [
  'createdAt',
  'updatedAt',
  'name',
  'selling_price',
  'cost_price',
  'stock_quantity',
] as const;

export class PaginationQueryDto {
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

  @IsOptional()
  @IsIn(Object.keys(PRODUCT_SORT_FIELDS))
  sortBy?: ProductSortField = 'createdAt';

  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  order?: 'ASC' | 'DESC' = 'DESC';

  [key: string]: unknown;
}
