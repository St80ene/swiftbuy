import { IsOptional, IsInt, Min, Max, IsString } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export const NormalizeSearch = () =>
  Transform(({ value }) => {
    if (typeof value !== 'string') {
      return value;
    }

    return value.trim().replace(/\s+/g, ' ');
  });

export const Trim = () =>
  Transform(({ value }) => (typeof value === 'string' ? value.trim() : value));

export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  @Trim()
  @NormalizeSearch()
  search?: string;

  [key: string]: any; // Allow additional properties for filtering
}
