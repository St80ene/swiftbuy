import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';
import { ApiResponse, successResponse } from '../utils/response.utils';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CloudinaryService } from '../utils/helpers/cloudinary.service';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async create(
    createProductDto: CreateProductDto,
    file?: Express.Multer.File,
  ): Promise<ApiResponse<Product>> {
    try {
      let finalImageUrl = '';

      // 3. If an image file was uploaded, send it to Cloudinary first
      if (file) {
        finalImageUrl = await this.cloudinaryService.uploadImage(
          file,
          'products',
        );
      }

      const product = this.productRepository.create({
        ...createProductDto,
        image_url: finalImageUrl || createProductDto?.image_url,
      });

      const savedProduct = await this.productRepository.save(product);
      return successResponse('Product created successfully', savedProduct);
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to create product. Please try again.',
      );
    }
  }

  async findAll({
    page,
    limit,
  }: {
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<{ products: Product[]; meta: any }>> {
    try {
      const pageNumber = Math.max(1, Number(page) || 1);
      const limitNumber = Math.max(1, Number(limit) || 10);
      const skip = (pageNumber - 1) * limitNumber;

      const [products, totalItems] = await this.productRepository.findAndCount({
        take: limitNumber,
        skip: skip,
        order: { createdAt: 'DESC' }, // Standard production practice: newest first
      });

      const totalPages = Math.ceil(totalItems / limitNumber);

      return successResponse('Products retrieved successfully', {
        products,
        meta: {
          totalItems,
          itemCount: products.length,
          itemsPerPage: limitNumber,
          totalPages,
          currentPage: pageNumber,
          hasNextPage: pageNumber < totalPages,
          hasPreviousPage: pageNumber > 1,
        },
      });
    } catch (error) {
      console.error('Error fetching products:', error);
      throw new InternalServerErrorException(
        'Error fetching products collection.',
      );
    }
  }

  async findOne(id: string): Promise<ApiResponse<Product>> {
    try {
      const product = await this.productRepository.findOne({ where: { id } });

      if (!product) {
        throw new NotFoundException(
          `Product with ID "${id}" could not be found.`,
        );
      }

      return successResponse('Product retrieved successfully', product);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      console.error(`Error fetching product ${id}:`, error);
      throw new InternalServerErrorException(
        'An error occurred while retrieving the product.',
      );
    }
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
    file?: Express.Multer.File, // 👈 Accept the optional file
  ): Promise<ApiResponse<Product>> {
    try {
      const product = await this.productRepository.findOne({ where: { id } });

      if (!product) {
        throw new NotFoundException(
          `Product with ID "${id}" could not be found.`,
        );
      }

      let oldImageUrl = '';

      // If a new image file is uploaded
      if (file) {
        // Keep track of the old image URL so we can delete it later
        oldImageUrl = product.image_url;

        // Upload the new image to Cloudinary
        const newImageUrl = await this.cloudinaryService.uploadImage(
          file,
          'products',
        );

        // Inject the new image URL into the DTO wrapper before merging
        updateProductDto.image_url = newImageUrl;
      }

      // Merge the partial updates directly into the fetched entity
      this.productRepository.merge(product, updateProductDto);
      const updatedProduct = await this.productRepository.save(product);

      // Clean up: If the DB update succeeded and we have an old image, delete it from Cloudinary
      if (oldImageUrl) {
        await this.cloudinaryService.deleteImage(oldImageUrl);
      }

      return successResponse('Product updated successfully', updatedProduct);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      console.error(`Error updating product ${id}:`, error);
      throw new InternalServerErrorException(
        'Failed to update product details.',
      );
    }
  }

  async remove(id: string): Promise<ApiResponse<null>> {
    try {
      const product = await this.productRepository.findOne({ where: { id } });

      if (!product) {
        throw new NotFoundException(
          `Product with ID "${id}" could not be found.`,
        );
      }

      // Production practice: Soft delete to preserve historical integrity
      await this.productRepository.softRemove(product);

      return successResponse('Product removed successfully', null);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      console.error(`Error deleting product ${id}:`, error);
      throw new InternalServerErrorException('Failed to remove product.');
    }
  }
}
