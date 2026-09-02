import { IsIn, IsOptional } from 'class-validator';
import * as categoryEntity from '../entities/category.entity';
import { NormalizeString } from '../../../common/utils/helpers/formatters';

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
