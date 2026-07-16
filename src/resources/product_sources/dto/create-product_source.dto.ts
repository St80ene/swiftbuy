import { Type } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateProductSourceDto {
  @IsString()
  @IsNotEmpty({ message: 'Product id is required.' })
  @Type(() => String)
  product_id!: string;

  @IsString()
  @IsNotEmpty({ message: 'Supplier id is required.' })
  @Type(() => String)
  supplier_id!: string;
}
