import { PartialType } from '@nestjs/mapped-types';
import { CreatePurchaseOrderDto } from './create-purchase_order.dto';
import { IsOptional, IsString, IsEnum } from 'class-validator';
import { PurchaseOrderStatus } from '../entities/purchase_order.entity';

export class UpdatePurchaseOrderDto extends PartialType(
  CreatePurchaseOrderDto,
) {
  @IsOptional()
  @IsString()
  supplier_name?: string;

  @IsOptional()
  @IsEnum(PurchaseOrderStatus)
  status?: PurchaseOrderStatus;
}
