import { IsEnum } from 'class-validator';
import { ProductStatus } from '../entities/product.entity';

export class ProductStatusUpdateDto {
  @IsEnum(ProductStatus, {
    message: 'status must be one of: ACTIVE, INACTIVE, ARCHIVED.',
  })
  status!: ProductStatus;
}

export const allowedTransitions: Record<ProductStatus, ProductStatus[]> = {
  [ProductStatus.ACTIVE]: [ProductStatus.INACTIVE, ProductStatus.ARCHIVED],

  [ProductStatus.INACTIVE]: [ProductStatus.ACTIVE, ProductStatus.ARCHIVED],

  [ProductStatus.ARCHIVED]: [ProductStatus.ACTIVE],
};
