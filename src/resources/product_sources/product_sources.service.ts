import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ProductSource } from './entities/product_source.entity';
import { CreateProductSourceDto } from './dto/create-product_source.dto';
import { UpdateProductSourceDto } from './dto/update-product_source.dto';
import { ApiResponse, successResponse } from '../../utils/response.utils';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

@Injectable()
export class ProductSourcesService {
  constructor(
    @InjectRepository(ProductSource)
    private readonly productSourceRepository: Repository<ProductSource>,
  ) {}

  async create(
    createProductSourceDto: CreateProductSourceDto,
  ): Promise<ProductSource> {
    const productSource = this.productSourceRepository.create(
      createProductSourceDto,
    );

    return await this.productSourceRepository.save(productSource);
  }

  async findAll(
    paginationQuery: PaginationQueryDto,
  ): Promise<ApiResponse<{ productSources: ProductSource[]; meta: any }>> {
    const { page = 1, limit = 10 } = paginationQuery;

    const [productSources, total] =
      await this.productSourceRepository.findAndCount({
        skip: (page - 1) * limit,
        take: limit,
        order: { createdAt: 'DESC' },
      });

    return successResponse('Product sources retrieved successfully', {
      productSources,
      meta: {
        total,
        skip: (page - 1) * limit,
        take: limit,
      },
    });
  }

  async findOne(id: string): Promise<ApiResponse<ProductSource>> {
    const productSource = await this.productSourceRepository.findOne({
      where: { id },
    });

    if (!productSource) {
      throw new NotFoundException(`Product source with ID ${id} not found`);
    }

    return successResponse('Product Supplier profile retrieved', productSource);
  }

  async update(
    id: string,
    updateProductSourceDto: UpdateProductSourceDto,
  ): Promise<ApiResponse<ProductSource>> {
    const { data: productSource } = await this.findOne(id);

    if (!productSource) {
      throw new NotFoundException('Product source not found');
    }

    this.productSourceRepository.merge(productSource, updateProductSourceDto);

    const savedProductSource =
      await this.productSourceRepository.save(productSource);

    return successResponse(
      'Product source profile updated successfully',
      savedProductSource,
    );
  }

  async remove(id: string): Promise<ApiResponse<null>> {
    const { data: productSource } = await this.findOne(id);

    if (!productSource) {
      throw new NotFoundException('Product source not found');
    }

    await this.productSourceRepository.remove(productSource);

    return successResponse('Product source deleted successfully', null);
  }
}
