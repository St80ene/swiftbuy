import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { NormalizeString } from '../../../common/utils/helpers/formatters';

export class CreateCategoryDto {
  @NormalizeString()
  @IsString()
  @IsNotEmpty({ message: 'Category name is required' })
  @MinLength(2, {
    message: 'Category name must be at least 2 characters',
  })
  @MaxLength(255, {
    message: 'Category name must not exceed 255 characters',
  })
  name!: string;

  @NormalizeString()
  @IsOptional()
  @IsString()
  @MaxLength(1000, {
    message: 'Category description must not exceed 1000 characters',
  })
  description?: string;

  @IsNotEmpty({ message: 'Business ID is required' })
  @IsUUID('4', {
    message: 'Business ID must be a valid UUID',
  })
  business_id!: string;
}
