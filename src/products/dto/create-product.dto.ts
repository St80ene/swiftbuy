// src/products/dto/create-product.dto.ts
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty({ message: 'Product name is required.' })
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01, { message: 'Price must be greater than 0.' })
  @Type(() => Number) // Form-data passes everything as strings; this safely forces it to a number
  price: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number) // Safely transforms string numeric inputs from form-data fields
  stock_quantity?: number;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  image_url?: string; // 👈 Populated by your service layer AFTER Cloudinary finishes
}
