import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsArray,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

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
  @Min(0, { message: 'Stock quantity cannot be negative.' })
  @Type(() => Number)
  stock_quantity!: number;

  @IsNumber()
  @Min(0, { message: 'Low stock threshold cannot be negative.' })
  @IsOptional()
  @Type(() => Number)
  is_low_stock?: number;

  @IsNumber()
  @Min(5, { message: 'Reorder level must be at least 5.' })
  @Type(() => Number)
  reorder_level!: number;

  @IsString()
  category!: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];
}
