import { AuditLogsService } from './../audit_logs/audit_logs.service';
import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { allowedTransitions, UpdateProductDto } from './dto/update-product.dto';
import {
  Product,
  UomBaseName,
  UomDisplayName,
  UomType,
} from './entities/product.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
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
import {
  BasePaginationQueryDto,
  PaginationMeta,
  PRODUCT_SORT_FIELDS,
  ProductPaginationQueryDto,
} from '../../common/dto/pagination-query.dto';
import { getPaginationOptions } from '../../utils/helpers/get_pagination_options.util';
import { DashboardCard } from '../dashboard/interfaces/initial_interface';
import { AuditLogAction, AuditLogEntity } from '../../enum/audit_log.enum';
import convertToIntegerBaseUnit from '../../utils/helpers/cloudinary/convertToBaseInteger';
import { AuditLog } from '../audit_logs/entities/audit_log.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly cloudinaryService: CloudinaryService,
    private readonly dataSource: DataSource,

    @Inject(AuditLogsService)
    private readonly auditLogService: AuditLogsService,
  ) {}

  /**
   * Creates a new product and initializes its inventory ledger.
   *
   * The operation uploads any provided product images, converts the reorder
   * level to the product's base unit, creates the product, and creates an
   * initial stock mutation with a quantity of zero.
   *
   * Database operations are executed within a transaction. If the transaction
   * fails after images have been uploaded, the uploaded Cloudinary assets are
   * deleted to prevent orphaned files.
   *
   * @param {CreateProductDto} createProductDto - Data required to create the product.
   * @param {Express.Multer.File[]} [files] - Optional product image files.
   * @returns {Promise<ApiResponse<Product>>} The created product.
   *
   * @throws {InternalServerErrorException} If the product creation process fails.
   */
  async create(
    createProductDto: CreateProductDto,
    files?: Express.Multer.File[],
  ): Promise<ApiResponse<Product>> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    const productImages: CloudinaryImage[] = [];

    try {
      // 1. Concurrent Image Upload Tracking
      if (files && files.length > 0) {
        console.log(
          `Uploading ${files.length} product images to Cloudinary...`,
        );
        const uploadPromises = files.map((file) =>
          this.cloudinaryService.uploadProductImage(file, 'products'),
        );
        const uploadedResults = await Promise.all(uploadPromises);
        productImages.push(...uploadedResults);
      }

      const reorderLevelBase = convertToIntegerBaseUnit(
        createProductDto.reorder_level || 5,
        createProductDto.uom_display_name,
      );

      // 3. Explicit Property Mapping (Mitigates Mass Assignment Risks)
      const product = queryRunner.manager.create(Product, {
        name: createProductDto.name,
        description: createProductDto.description ?? '',
        selling_price: createProductDto.selling_price,
        cost_price: createProductDto.cost_price,
        ...(productImages.length > 0 && { images: productImages }),
        reorder_level: reorderLevelBase,
        is_low_stock: 0 <= reorderLevelBase,
        uom_type: createProductDto.uom_type,
        uom_base_name: createProductDto.uom_base_name,
        uom_display_name: createProductDto.uom_display_name,
      });

      const savedProduct = await queryRunner.manager.save(Product, product);

      // 4. Ledger Entry Creation
      const mutation = queryRunner.manager.create(Stocks, {
        product_id: savedProduct.id,
        type: MutationType.INFLOW,
        reason: MutationReason.NEW_PRODUCT_INITIALIZATION,
        quantity: 0,
        unit_cost_price: savedProduct.cost_price,
        unit_selling_price: savedProduct.selling_price,
      });

      await queryRunner.manager.save(Stocks, mutation);

      await queryRunner.commitTransaction();
      return successResponse('Product created successfully', savedProduct);
    } catch (error) {
      await queryRunner.rollbackTransaction();

      // Cleanup: Purge remote Cloudinary assets on DB failure
      if (productImages.length > 0) {
        await Promise.all(
          productImages.map((img) =>
            this.cloudinaryService.deleteImage(img.publicId).catch(() => null),
          ),
        );
      }

      console.log('Error creating product:', error);
      throw new InternalServerErrorException('Failed to create product.');
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Retrieves a paginated collection of active products.
   *
   * Supports searching by product name or description and sorting using
   * the allowed product sort fields. Soft-deleted products are excluded
   * from the result.
   *
   * @param {ProductPaginationQueryDto} paginationQuery - Pagination, search, and sorting options.
   * @returns {Promise<ApiResponse<{ products: Product[]; meta: any }>>}
   * A paginated collection of products and pagination metadata.
   *
   * @throws {InternalServerErrorException} If the product collection cannot be retrieved.
   */
  async findAll(
    paginationQuery: ProductPaginationQueryDto,
  ): Promise<ApiResponse<{ products: Product[]; meta: PaginationMeta }>> {
    try {
      const {
        page: pageNumber,
        limit: limitNumber,
        skip,
      } = getPaginationOptions(paginationQuery);

      const {
        search,
        status,
        order = 'DESC',
        sortBy = 'createdAt',
      } = paginationQuery;

      const sortColumn = PRODUCT_SORT_FIELDS[sortBy];

      const sortOrder: 'ASC' | 'DESC' =
        order?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

      const queryBuilder = this.productRepository
        .createQueryBuilder('product')
        .where('product.deletedAt IS NULL');

      if (search) {
        queryBuilder.andWhere(
          `
          (
            LOWER(product.name) LIKE LOWER(:search)
            OR LOWER(product.description) LIKE LOWER(:search)
          )
        `,
          {
            search: `%${search}%`,
          },
        );
      }

      // Filter by product lifecycle status
      if (status) {
        queryBuilder.andWhere('product.status = :status', { status });
      }

      queryBuilder.orderBy(sortColumn, sortOrder).skip(skip).take(limitNumber);

      const [products, totalItems] = await queryBuilder.getManyAndCount();

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
   * Retrieves a single product by its unique identifier.
   *
   * The associated stock relationship is included in the response.
   * Soft-deleted products are not returned.
   *
   * @param {string} id - The unique identifier of the product.
   * @returns {Promise<ApiResponse<Product>>} The requested product.
   *
   * @throws {NotFoundException} If no product exists with the provided ID.
   * @throws {InternalServerErrorException} If the product cannot be retrieved.
   */
  async findOne(id: string): Promise<ApiResponse<Product>> {
    try {
      const product = await this.productRepository.findOne({
        where: { id },
        relations: { stock: true },
      });

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
   * Updates an existing product and manages associated product images.
   *
   * Supports partial updates to product information, including pricing,
   * description, unit-of-measure configuration, reorder level, and images.
   * Reorder levels are converted to the product's base unit before storage.
   *
   * Images marked for deletion are removed from Cloudinary, while newly
   * uploaded files are added to the existing product image collection.
   *
   * The product update is executed within a database transaction. An audit
   * record should capture the relevant state before and after the update.
   *
   * Stock quantities are not intended to be modified through this method.
   * Stock mutations should be handled by the Stock Management module.
   *
   * @param {string} id - The unique identifier of the product to update.
   * @param {UpdateProductDto} updateProductDto - Product fields to update.
   * @param {Express.Multer.File[]} [files] - Optional new product image files.
   * @returns {Promise<ApiResponse<Product>>} The updated product.
   *
   * @throws {NotFoundException} If the product does not exist.
   * @throws {InternalServerErrorException} If the update operation fails.
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
      const oldProductDetails = product;

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
      const currentUomDisplayName =
        updateProductDto.uom_display_name || product.uom_display_name;

      // Recalculate dynamic flags based on the base unit updates
      if (updateProductDto.reorder_level !== undefined) {
        product.reorder_level = convertToIntegerBaseUnit(
          updateProductDto.reorder_level,
          currentUomDisplayName,
        );
      }

      if (updateProductDto.status) {
        const oldStatus = product.status;

        // Nothing to update
        if (oldStatus === updateProductDto.status) {
          throw new BadRequestException(
            `Product is already ${status.toLowerCase()}.`,
          );
        }

        // Validate allowed status transitions
        if (!allowedTransitions[oldStatus].includes(updateProductDto.status)) {
          throw new BadRequestException(
            `Product cannot be changed from ${oldStatus} to ${updateProductDto.status}.`,
          );
        }

        // Update status
        product.status = updateProductDto.status;
      }

      // check for product?.stock_quantity is above 0 or you assign default value as 0
      if (product?.stock_quantity)
        // 3. Save adjustments safely via queryRunner manager
        queryRunner.manager.merge(Product, product, {
          name: updateProductDto.name,
          description: updateProductDto.description,
          cost_price: updateProductDto.cost_price,
          selling_price: updateProductDto.selling_price,
          uom_type: updateProductDto.uom_type as UomType,
          uom_base_name: updateProductDto.uom_base_name as UomBaseName,
          uom_display_name: updateProductDto.uom_display_name as UomDisplayName,
        });

      const updatedProduct = await queryRunner.manager.save(Product, product);
      await queryRunner.commitTransaction();

      await this.auditLogService.create({
        action: AuditLogAction.UPDATE,
        entity: AuditLogEntity.PRODUCT,
        entityId: product.id,
        oldValue: oldProductDetails,
        newValue: updatedProduct,
        metadata: {
          productName: product.name,
          // sku: product.sku,
          // companyId: product.companyId,
          // supplierId: product.supplierId,
          createdAt: new Date().toISOString(),
          reason: `${product.name} was updated by user`,
        },
      });

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
   * Soft-deletes a product and removes its associated remote image assets.
   *
   * Before soft deletion, all associated product images are removed from
   * Cloudinary and the product image collection is cleared.
   *
   * The product record remains in the database through TypeORM soft deletion
   * to preserve historical references and inventory ledger relationships.
   *
   * An audit record is created to preserve the product's state before deletion.
   *
   * @param {string} id - The unique identifier of the product to remove.
   * @returns {Promise<ApiResponse<null>>} A successful deletion response.
   *
   * @throws {NotFoundException} If the product does not exist.
   * @throws {InternalServerErrorException} If the deletion operation fails.
   */
  async remove(id: string): Promise<ApiResponse<null>> {
    try {
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
      const deleted = await this.productRepository.softRemove(product);

      // run audit log here
      await this.auditLogService.create({
        action: AuditLogAction.DELETE,
        entity: AuditLogEntity.PRODUCT,
        entityId: product.id,
        oldValue: product,
        newValue: deleted,
        metadata: {
          productName: product.name,
          // companyId: product.companyId,
          // supplierId: product.supplierId,
          deletedAt: new Date().toISOString(),
          reason: 'User initiated deletion',
        },
      });

      return successResponse('Product removed successfully', null);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      console.error(`Error deleting product ${id}:`, error);
      throw new InternalServerErrorException('Failed to remove product.');
    }
  }

  /**
   * Calculates high-level inventory health metrics for the dashboard.
   *
   * Aggregates product and inventory data to provide:
   * - Total number of products.
   * - Total quantity of stock available.
   * - Number of products at or below their reorder level.
   * - Number of out-of-stock products.
   * - Total inventory value based on cost price.
   *
   * The returned metrics are formatted as dashboard cards suitable for
   * presentation in the inventory dashboard.
   *
   * @returns {Promise<DashboardCard[]>} A collection of inventory health cards.
   */
  async getInventoryHealth(): Promise<DashboardCard[]> {
    const queryBuilder = this.productRepository.createQueryBuilder('product');

    const result: Record<string, any> | undefined = await queryBuilder
      .select('COUNT(product.id)', 'totalProducts')
      .addSelect('COALESCE(SUM(product.stock_quantity), 0)', 'totalStock')
      .addSelect(
        'SUM(CASE WHEN product.stock_quantity <= product.reorder_level THEN 1 ELSE 0 END)',
        'lowStock',
      )
      .addSelect(
        'SUM(CASE WHEN product.stock_quantity = 0 THEN 1 ELSE 0 END)',
        'outOfStock',
      )
      .addSelect(
        'COALESCE(SUM(product.stock_quantity * product.cost_price), 0)',
        'inventoryValue',
      )
      .getRawOne();

    return [
      {
        id: 'products',
        title: 'Products',
        value: Number(result?.totalProducts),
        severity: 'success',
      },
      {
        id: 'stock',
        title: 'Total Stock',
        value: Number(result?.totalStock),
        severity: 'success',
      },
      {
        id: 'low-stock',
        title: 'Low Stock',
        value: Number(result?.lowStock),
        severity: Number(result?.lowStock) > 0 ? 'warning' : 'success',
        subtitle: 'Products below reorder level',
        action: {
          label: 'Create Purchase Requests',
          url: '/purchase-orders/create',
        },
      },
    ];
  }

  /**
   * Retrieves the paginated audit history for a specific product.
   *
   * Filters audit logs by the product entity type and product ID,
   * returning the most recent events first.
   *
   * @param productId - The unique identifier of the product.
   * @param page - The page number to retrieve. Defaults to 1.
   * @param limit - The maximum number of audit logs per page. Defaults to 20.
   *
   * @returns A paginated collection of audit logs containing:
   * - `data` - Audit log records for the requested page.
   * - `total` - Total number of audit logs for the product.
   * - `page` - Current page number.
   * - `limit` - Number of records requested per page.
   * - `totalPages` - Total number of available pages.
   */
  async getProductAuditLogs(
    productId: string,
    query: BasePaginationQueryDto,
  ): Promise<
    ApiResponse<{
      auditLogs: AuditLog[];
      meta: PaginationMeta;
    }>
  > {
    return await this.auditLogService.getEntityAuditLogs(
      AuditLogEntity.PRODUCT,
      productId,
      query,
    );
  }
}
