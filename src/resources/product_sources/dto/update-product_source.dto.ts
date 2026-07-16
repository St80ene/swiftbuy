import { PartialType } from '@nestjs/mapped-types';
import { CreateProductSourceDto } from './create-product_source.dto';

export class UpdateProductSourceDto extends PartialType(CreateProductSourceDto) {}
