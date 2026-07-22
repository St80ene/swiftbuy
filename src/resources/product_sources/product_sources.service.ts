import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
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
  ): Promise<ApiResponse<ProductSource>> {
    const { product_id, supplier_id } = createProductSourceDto;

    // Check if this product-supplier link already exists
    const existingSource = await this.productSourceRepository.findOne({
      where: { product_id, supplier_id },
    });

    if (existingSource) {
      throw new ConflictException(
        'Product source relation for this product and supplier already exists',
      );
    }

    const productSource = this.productSourceRepository.create(
      createProductSourceDto,
    );

    const savedSource = await this.productSourceRepository.save(productSource);

    return successResponse('Product Source created successfully', savedSource);
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
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  }

  async findOne(id: string): Promise<ApiResponse<ProductSource>> {
    const productSource = await this.productSourceRepository.findOne({
      where: { id },
    });

    if (!productSource) {
      throw new NotFoundException(`Product Source with ID ${id} not found`);
    }

    return successResponse('Product Source retrieved', productSource);
  }

  async update(
    id: string,
    updateProductSourceDto: UpdateProductSourceDto,
  ): Promise<ApiResponse<ProductSource>> {
    const { data: productSource } = await this.findOne(id);

    if (!productSource) {
      throw new NotFoundException(`Product Source with ID ${id} not found`);
    }

    this.productSourceRepository.merge(productSource, updateProductSourceDto);

    const savedProductSource =
      await this.productSourceRepository.save(productSource);

    return successResponse(
      'Product Source updated successfully',
      savedProductSource,
    );
  }

  async remove(id: string): Promise<ApiResponse<null>> {
    const { data: productSource } = await this.findOne(id);

    if (!productSource) {
      throw new NotFoundException(`Product Source with ID ${id} not found`);
    }

    await this.productSourceRepository.remove(productSource);

    return successResponse('Product Source deleted successfully', null);
  }
}
