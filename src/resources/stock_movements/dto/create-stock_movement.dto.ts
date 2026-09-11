import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import {
  StockMovementDirection,
  StockMovementReferenceType,
  StockMovementType,
} from '../entities/stock_movement.entity';

export class CreateStockMovementDto {
  @IsUUID()
  @IsNotEmpty()
  product_id!: string;

  @IsEnum(StockMovementType, {
    message:
      'Invalid stock movement type. Must be one of: RECEIPT, SALE, ADJUSTMENT, TRANSFER_IN, TRANSFER_OUT, RETURN_IN, RETURN_OUT, DAMAGE, LOSS, REVERSAL.',
  })
  type!: StockMovementType;

  @IsEnum(StockMovementDirection, {
    message: 'Direction must be either IN or OUT.',
  })
  direction!: StockMovementDirection;

  @IsNumber()
  @Min(1, {
    message: 'Quantity must be at least 1.',
  })
  @Type(() => Number)
  quantity!: number;

  @IsNumber(
    { maxDecimalPlaces: 2 },
    {
      message:
        'Unit cost price must be a valid number with at most 2 decimals.',
    },
  )
  @Min(0, {
    message: 'Unit cost price cannot be negative.',
  })
  @Type(() => Number)
  unit_cost_price!: number;

  @IsNumber(
    { maxDecimalPlaces: 2 },
    {
      message:
        'Unit selling price must be a valid number with at most 2 decimals.',
    },
  )
  @Min(0, {
    message: 'Unit selling price cannot be negative.',
  })
  @Type(() => Number)
  @IsOptional()
  unit_selling_price?: number;

  @IsString()
  @IsOptional()
  reason?: string;

  @IsEnum(StockMovementReferenceType, {
    message:
      'Invalid reference type. Must be a valid stock movement reference.',
  })
  @IsOptional()
  reference_type?: StockMovementReferenceType;

  @IsUUID()
  @IsOptional()
  reference_id?: string;
}
