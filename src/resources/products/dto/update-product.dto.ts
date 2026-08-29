import { PartialType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto';
import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';
import { ProductStatus } from '../entities/product.entity';

export class UpdateProductDto extends PartialType(CreateProductDto) {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imagesToDelete?: string[]; // ◄ Array of Cloudinary publicIds to remove

  @IsOptional()
  @IsEnum(ProductStatus, {
    message: 'status must be one of: ACTIVE, INACTIVE, ARCHIVED.',
  })
  status?: ProductStatus;
}

export const allowedTransitions: Record<ProductStatus, ProductStatus[]> = {
  [ProductStatus.ACTIVE]: [ProductStatus.INACTIVE, ProductStatus.ARCHIVED],

  [ProductStatus.INACTIVE]: [ProductStatus.ACTIVE, ProductStatus.ARCHIVED],

  [ProductStatus.ARCHIVED]: [ProductStatus.ACTIVE],
};
