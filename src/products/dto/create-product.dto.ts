// products/dto/create-product.dto.ts
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  image_url?: string;

  @Type(() => Number) // Converts form-data string "45" to number 45
  @IsNumber()
  @IsOptional()
  @Min(0)
  stock_quantity?: number;

  @Type(() => Number) // Converts form-data string "89.99" to number 89.99
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  price!: number;

  @IsString()
  @IsOptional()
  category?: string;
}
