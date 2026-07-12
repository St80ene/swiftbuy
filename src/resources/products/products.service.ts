import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, IsNull } from 'typeorm';
import {
  CloudinaryService,
  CloudinaryImage,
} from '../../utils/helpers/cloudinary/cloudinary.service';
import { ApiResponse, successResponse } from '../../utils/response.utils';
import {
  MutationReason,
  MutationType,
  Stocks,
} from '../stocks/entities/stock.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly cloudinaryService: CloudinaryService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * ─── CREATE PRODUCT WITH AUDIT LEDGER ───
   */
  async create(
    createProductDto: CreateProductDto,
    files?: Express.Multer.File[], // ◄ Expect an array
  ): Promise<ApiResponse<Product>> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let productImages: CloudinaryImage[] = [];

      // Loop and upload all images concurrently if files exist
      if (files && files.length > 0) {
        const uploadPromises = files.map((file) =>
          this.cloudinaryService.uploadProductImage(file, 'products'),
        );
        productImages = await Promise.all(uploadPromises);
      }

      const initialStock = Number(createProductDto.stock_quantity) || 0;

      // 2. Build the core product record
      const product = queryRunner.manager.create(Product, {
        ...createProductDto,
        images: productImages, // ◄ Saves the JSON array of Cloudinary assets
        stock_quantity: initialStock,
        is_low_stock: initialStock <= (createProductDto.reorder_level || 5),
      });

      const savedProduct = await queryRunner.manager.save(Product, product);

      // 3. Ledger Allocation
      const mutation = queryRunner.manager.create(Stocks, {
        product_id: savedProduct.id,
        type: MutationType.INFLOW,
        reason:
          initialStock > 0
            ? MutationReason.SUPPLIER_RESTOCK
            : MutationReason.NEW_PRODUCT_INITIALIZATION,
        quantity: initialStock,
        unit_cost_price: savedProduct.cost_price,
        unit_selling_price: savedProduct.selling_price,
      });

      await queryRunner.manager.save(Stocks, mutation);

      await queryRunner.commitTransaction();
      return successResponse('Product created successfully', savedProduct);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('Error creating product:', error);
      throw new InternalServerErrorException('Failed to create product.');
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * ─── FIND ALL ───
   */
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
        order: { createdAt: 'DESC' },
        where: { deletedAt: IsNull() },
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
      console.error('Error fetching products catalog:', error);
      throw new InternalServerErrorException(
        'Error fetching products collection.',
      );
    }
  }

  /**
   * ─── FIND ONE ───
   */
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

  /**
   * ─── UPDATE PRODUCT WITH AUTOMATED STOCK CORRECTIONS ───
   */
  async update(
    id: string,
    updateProductDto: UpdateProductDto,
    files?: Express.Multer.File[],
  ): Promise<ApiResponse<Product>> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const product = await queryRunner.manager.findOne(Product, {
        where: { id },
      });

      if (!product) {
        throw new NotFoundException(
          `Product with ID "${id}" could not be found.`,
        );
      }

      // --- NEW PARTIAL IMAGE MANAGEMENT LOGIC ---
      let currentImages = [...(product.images || [])];

      // 1. Process deletions if specific publicIds are targeted
      if (
        updateProductDto.imagesToDelete &&
        updateProductDto.imagesToDelete.length > 0
      ) {
        for (const publicId of updateProductDto.imagesToDelete) {
          // Delete from Cloudinary
          await this.cloudinaryService.deleteImage(publicId);

          // Remove from local tracking array
          currentImages = currentImages.filter(
            (img) => img.publicId !== publicId,
          );
        }
      }

      // 2. Process new uploads and append them if any exist
      if (files && files.length > 0) {
        const uploadPromises = files.map((file) =>
          this.cloudinaryService.uploadProductImage(file, 'products'),
        );
        const newAssets = await Promise.all(uploadPromises);

        // Append new images instead of overwriting the whole array
        currentImages = [...currentImages, ...newAssets];
      }

      // Assign the final adjusted array back to the product record
      product.images = currentImages;
      // ------------------------------------------

      // 2. Audit Ledger Drift Monitoring
      if (updateProductDto.stock_quantity !== undefined) {
        const newStock = Number(updateProductDto.stock_quantity);
        if (newStock !== product.stock_quantity) {
          const difference = newStock - product.stock_quantity;

          const mutation = queryRunner.manager.create(Stocks, {
            product_id: product.id,
            type: difference > 0 ? MutationType.INFLOW : MutationType.OUTFLOW,
            reason: MutationReason.AUDIT_CORRECTION,
            quantity: Math.abs(difference),
            unit_cost_price: updateProductDto.cost_price ?? product.cost_price,
            unit_selling_price:
              updateProductDto.selling_price ?? product.selling_price,
          });

          await queryRunner.manager.save(Stocks, mutation);
          product.stock_quantity = newStock;
        }
      }

      // 3. Save adjustments safely
      queryRunner.manager.merge(Product, product, {
        // 👈 Use queryRunner.manager.merge inside transactions!
        name: updateProductDto.name,
        description: updateProductDto.description,
        cost_price: updateProductDto.cost_price,
        selling_price: updateProductDto.selling_price,
        category: updateProductDto.category,
      });

      const updatedProduct = await queryRunner.manager.save(Product, product);
      await queryRunner.commitTransaction();

      return successResponse('Product updated successfully', updatedProduct);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error instanceof NotFoundException) throw error;
      console.error(`Error updating product ${id}:`, error);
      throw new InternalServerErrorException(
        'Failed to update product details.',
      );
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * ─── REMOVE (SOFT-DELETE WITH AUTOMATIC ASSET TEARDOWN) ───
   */
  async remove(id: string): Promise<ApiResponse<null>> {
    try {
      // FIXED: Removed company_id lookup layer
      const product = await this.productRepository.findOne({ where: { id } });

      if (!product) {
        throw new NotFoundException(
          `Product with ID "${id}" could not be found.`,
        );
      }

      // 1. Wipe remote files to optimize space
      if (product.images && product.images.length > 0) {
        for (const img of product.images) {
          await this.cloudinaryService.deleteImage(img.publicId);
        }
      }

      product.images = [];
      await this.productRepository.save(product);

      // 2. Perform TypeORM softRemove to preserve historical ledger logs
      await this.productRepository.softRemove(product);

      return successResponse('Product removed successfully', null);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      console.error(`Error deleting product ${id}:`, error);
      throw new InternalServerErrorException('Failed to remove product.');
    }
  }
}
