import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import {
  Product,
  UomBaseName,
  UomDisplayName,
  UomType,
} from './entities/product.entity';
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
import convertToIntegerBaseUnit from '../../utils/convertToBaseInteger';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

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
    files?: Express.Multer.File[],
  ): Promise<ApiResponse<Product>> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let productImages: CloudinaryImage[] = [];

      if (files && files.length > 0) {
        const uploadPromises = files.map((file) =>
          this.cloudinaryService.uploadProductImage(file, 'products'),
        );
        productImages = await Promise.all(uploadPromises);
      }

      // Convert incoming human stock quantity to integer base units (e.g. 1.5kg -> 1500g)
      const initialStockBase = convertToIntegerBaseUnit(
        createProductDto.stock_quantity,
        createProductDto.uom_type as UomType,
      );

      const reorderLevelBase = convertToIntegerBaseUnit(
        createProductDto.reorder_level || 5,
        createProductDto.uom_type as UomType,
      );

      // 2. Build the core product record
      const product = queryRunner.manager.create(Product, {
        ...createProductDto,
        images: productImages,
        stock_quantity: initialStockBase,
        reorder_level: reorderLevelBase,
        is_low_stock: initialStockBase <= reorderLevelBase,
        uom_type: createProductDto.uom_type as UomType,
        uom_base_name: createProductDto.uom_base_name as UomBaseName,
        uom_display_name: createProductDto.uom_display_name as UomDisplayName,
      });

      const savedProduct = await queryRunner.manager.save(Product, product);

      // 3. Complete Ledger Trace Allocation (Real-World Audit Pattern)
      const mutation = queryRunner.manager.create(Stocks, {
        product_id: savedProduct.id,
        type: MutationType.INFLOW,
        reason:
          initialStockBase > 0
            ? MutationReason.SUPPLIER_RESTOCK
            : MutationReason.NEW_PRODUCT_INITIALIZATION,
        quantity: initialStockBase, // Guarded as safe base integer
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
  async findAll(
    paginationQuery: PaginationQueryDto,
  ): Promise<ApiResponse<{ products: Product[]; meta: any }>> {
    try {
      const { page = 1, limit = 10 } = paginationQuery;
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

      // 1. Partial Image Management Strategy
      let currentImages = [...(product.images || [])];

      if (
        updateProductDto.imagesToDelete &&
        updateProductDto.imagesToDelete.length > 0
      ) {
        for (const publicId of updateProductDto.imagesToDelete) {
          await this.cloudinaryService.deleteImage(publicId);
          currentImages = currentImages.filter(
            (img) => img.publicId !== publicId,
          );
        }
      }

      if (files && files.length > 0) {
        const uploadPromises = files.map((file) =>
          this.cloudinaryService.uploadProductImage(file, 'products'),
        );
        const newAssets = await Promise.all(uploadPromises);
        currentImages = [...currentImages, ...newAssets];
      }

      product.images = currentImages;

      // 2. Audit Ledger Drift Monitoring with UOM Translation
      const currentUomType = updateProductDto.uom_type || product.uom_type;

      if (updateProductDto.stock_quantity !== undefined) {
        // Convert updated human quantity input to base unit scale matching target UOM
        const newStockBase = convertToIntegerBaseUnit(
          updateProductDto.stock_quantity,
          currentUomType as UomType,
        );

        if (newStockBase !== product.stock_quantity) {
          const difference = newStockBase - product.stock_quantity;

          const mutation = queryRunner.manager.create(Stocks, {
            product_id: product.id,
            type: difference > 0 ? MutationType.INFLOW : MutationType.OUTFLOW,
            reason: MutationReason.AUDIT_CORRECTION,
            quantity: Math.abs(difference), // Saved as absolute integer base value
            unit_cost_price: updateProductDto.cost_price ?? product.cost_price,
            unit_selling_price:
              updateProductDto.selling_price ?? product.selling_price,
          });

          await queryRunner.manager.save(Stocks, mutation);
          product.stock_quantity = newStockBase;
        }
      }

      // Recalculate dynamic flags based on the base unit updates
      if (updateProductDto.reorder_level !== undefined) {
        product.reorder_level = convertToIntegerBaseUnit(
          updateProductDto.reorder_level,
          currentUomType as UomType,
        );
      }
      product.is_low_stock = product.stock_quantity <= product.reorder_level;

      // 3. Save adjustments safely via queryRunner manager
      queryRunner.manager.merge(Product, product, {
        name: updateProductDto.name,
        description: updateProductDto.description,
        cost_price: updateProductDto.cost_price,
        selling_price: updateProductDto.selling_price,
        category: updateProductDto.category,
        uom_type: updateProductDto.uom_type as UomType,
        uom_base_name: updateProductDto.uom_base_name as UomBaseName,
        uom_display_name: updateProductDto.uom_display_name as UomDisplayName,
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
