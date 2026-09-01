import { IsIn, IsOptional } from 'class-validator';
import { NormalizeString } from '../../../utils/helpers/formatters';
import * as categoryEntity from '../entities/category.entity';

export class CategoryPaginationQueryDto {
  @IsOptional()
  @NormalizeString()
  search?: string;

  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  order?: 'ASC' | 'DESC';

  @IsOptional()
  @IsIn(categoryEntity.CATEGORY_SORT_FIELD_NAMES)
  sortBy?: categoryEntity.CategorySortField;

  @IsOptional()
  page?: number;

  @IsOptional()
  limit?: number;
}
