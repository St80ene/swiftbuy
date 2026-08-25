import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  UomType,
  UomBaseName,
  UomDisplayName,
} from '../entities/product.entity';
import { IsValidUom } from '../../../common/validators/uom.validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty({ message: 'Product name is required.' })
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01, { message: 'Selling price must be greater than 0.' })
  @Type(() => Number) // Form-data passes everything as strings; this safely forces it to a number
  selling_price!: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.0, { message: 'Cost price cannot be negative.' })
  @Type(() => Number) // cost_price to match the schema for profit margins
  cost_price!: number;

  @IsNumber()
  @Min(5, { message: 'Reorder level must be at least 5.' })
  @Type(() => Number)
  reorder_level!: number;

  // Unit of Measure (UOM) fields
  @IsEnum(UomType, {
    message: 'uom_type must be one of: UNIT, WEIGHT, VOLUME.',
  })
  uom_type!: UomType;

  @IsEnum(UomBaseName, {
    message: 'uom_base_name must be one of: pcs, g, ml.',
  })
  uom_base_name!: UomBaseName;

  @IsEnum(UomDisplayName, {
    message: 'uom_display_name must be one of: pcs, kg, L.',
  })
  @IsValidUom({
    message:
      'Invalid UOM combination. UNIT must use pcs. WEIGHT must use g with g/kg. VOLUME must use ml with ml/L.',
  })
  uom_display_name!: UomDisplayName;
}
