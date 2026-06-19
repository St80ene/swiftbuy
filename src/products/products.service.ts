import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';
import {
  ApiResponse,
  errorResponse,
  successResponse,
} from 'src/utils/response.utils';

@Injectable()
export class ProductsService {
  constructor() {}
  async create(createProductDto: CreateProductDto): Promise<Product> {
    try {
      const product = new Product(createProductDto);
      await product.save();
      return product;
    } catch (error) {
      console.error('Error creating product:', error);
      throw new InternalServerErrorException('Failed to create product');
    }
  }

  async findAll({
    page = 1,
    limit = 10,
  }): Promise<ApiResponse<{ products: Product[]; total: number }>> {
    try {
      const pageNumber = page || 1;
      const skip = (pageNumber - 1) * limit;

      const [products, total] = await Product.findAndCount({
        take: limit,
        skip,
      });

      return successResponse('Products retrieved successfully', {
        products,
        total,
      });
    } catch (error) {
      throw new InternalServerErrorException('Error fetching products');
    }
  }

  async findOne(id: string): Promise<ApiResponse<Product>> {
    try {
      const product = await Product.findOne({ where: { id } });
      if (!product) {
        throw new NotFoundException(errorResponse('product not found'));
      }
      return successResponse('Product retrieved successfully', product);
    } catch (error) {
      throw new InternalServerErrorException(
        errorResponse('Error fetching product', error),
      );
    }
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    try {
      const product = await Product.findOne({ where: { id } });

      if (!product) {
        throw new NotFoundException(
          `The requested product could not be found.`,
        );
      }

      Object.assign(product, updateProductDto);
      await product.save();
      return product;
    } catch (error) {
      throw new InternalServerErrorException(
        errorResponse('Error updating product', error),
      );
    }
  }

  async remove(id: string): Promise<ApiResponse<null>> {
    try {
      const product = await Product.findOne({ where: { id } });
      if (!product) {
        throw new NotFoundException(`Product with ID "${id}" not found`);
      }
      await product.remove();
      return successResponse('Product removed successfully', null);
    } catch (error) {
      throw new InternalServerErrorException(
        errorResponse('Error removing product', error),
      );
    }
  }
}
