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
import { Product } from './entities/product.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
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
import { DashboardCard } from '../dashboard/interfaces/initial_interface';
import {
  AuditLogAction,
  AuditLogEntity,
} from '../../common/enum/audit_log.enum';
import {
  CloudinaryService,
  CloudinaryImage,
} from '../../common/utils/helpers/cloudinary/cloudinary.service';
import convertToIntegerBaseUnit from '../../common/utils/helpers/cloudinary/convertToBaseInteger';
import { getPaginationOptions } from '../../common/utils/helpers/get_pagination_options.util';
import {
  ApiResponse,
  successResponse,
} from '../../common/utils/response.utils';
import { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface';
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

  async create(
    createProductDto: CreateProductDto,
    user: AuthenticatedUser,
    files?: Express.Multer.File[],
  ): Promise<ApiResponse<Product>> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    const productImages: CloudinaryImage[] = [];

    try {
      if (files && files.length > 0) {
        const uploadPromises = files.map((file) =>
          this.cloudinaryService.uploadImage(file, 'products'),
        );
        const uploadedResults = await Promise.all(uploadPromises);
        productImages.push(...uploadedResults);
      }

      const reorderLevelBase = convertToIntegerBaseUnit(
        createProductDto.reorder_level || 5,
        createProductDto.uom_display_name,
      );

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
        category_id: createProductDto.category_id,
        business_id: user.businessId,
      });

      const savedProduct = await queryRunner.manager.save(Product, product);

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

      if (productImages.length > 0) {
        await Promise.all(
          productImages.map((img) =>
            this.cloudinaryService.deleteImage(img.publicId).catch(() => null),
          ),
        );
      }

      console.error('Error creating product:', error);

      throw new InternalServerErrorException('Failed to create product.');
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(
    paginationQuery: ProductPaginationQueryDto,
    user: AuthenticatedUser,
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
        sortBy = 'updated_at',
      } = paginationQuery;

      const sortColumn = PRODUCT_SORT_FIELDS[sortBy];
      const sortOrder: 'ASC' | 'DESC' =
        order?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

      const queryBuilder = this.productRepository
        .createQueryBuilder('product')
        .where('product.deleted_at IS NULL')
        .andWhere('product.business_id = :businessId', {
          businessId: user.businessId,
        });

      if (search) {
        queryBuilder.andWhere(
          `
          (
            LOWER(product.name) LIKE LOWER(:search)
            OR LOWER(product.description) LIKE LOWER(:search)
          )
        `,
          { search: `%${search}%` },
        );
      }

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

  async findOne(
    id: string,
    user: AuthenticatedUser,
  ): Promise<ApiResponse<Product>> {
    const product = await this.productRepository.findOne({
      where: { id, business_id: user.businessId, deleted_at: undefined },
      relations: { stock: true, category: true },
    });

    if (!product) {
      throw new NotFoundException(
        `Product with ID "${id}" could not be found.`,
      );
    }

    return successResponse('Product retrieved successfully', product);
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
    user: AuthenticatedUser,
    files?: Express.Multer.File[],
  ): Promise<ApiResponse<Product>> {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const product = await queryRunner.manager.findOne(Product, {
        where: { id, business_id: user.businessId, deleted_at: undefined },
      });

      if (!product) {
        throw new NotFoundException(
          `Product with ID "${id}" could not be found.`,
        );
      }

      const oldProductDetails = structuredClone(product);
      const { imagesToDelete, reorder_level, status, ...productUpdates } =
        updateProductDto;

      let currentImages = [...(product.images ?? [])];

      if (imagesToDelete?.length) {
        for (const publicId of imagesToDelete) {
          await this.cloudinaryService.deleteImage(publicId);
          currentImages = currentImages.filter(
            (image) => image.publicId !== publicId,
          );
        }
      }

      if (files?.length) {
        const uploadPromises = files.map((file) =>
          this.cloudinaryService.uploadImage(file, 'products'),
        );
        const newAssets = await Promise.all(uploadPromises);
        currentImages = [...currentImages, ...newAssets];
      }

      product.images = currentImages;

      const currentUomDisplayName =
        updateProductDto.uom_display_name ?? product.uom_display_name;

      if (reorder_level !== undefined) {
        product.reorder_level = convertToIntegerBaseUnit(
          reorder_level,
          currentUomDisplayName,
        );
      }

      if (status !== undefined) {
        const oldStatus = product.status;

        if (oldStatus === status) {
          throw new BadRequestException(
            `Product is already ${oldStatus.toLowerCase()}.`,
          );
        }

        if (!allowedTransitions[oldStatus].includes(status)) {
          throw new BadRequestException(
            `Product cannot be changed from ${oldStatus} to ${status}.`,
          );
        }

        product.status = status;
      }

      queryRunner.manager.merge(Product, product, productUpdates);
      const updatedProduct = await queryRunner.manager.save(Product, product);
      const newProductDetails = structuredClone(updatedProduct);

      await this.auditLogService.create({
        action: AuditLogAction.UPDATE,
        entity: AuditLogEntity.PRODUCT,
        entityId: updatedProduct.id,
        oldValue: oldProductDetails,
        newValue: newProductDetails,
        metadata: {
          productName: updatedProduct.name,
          businessId: user.businessId,
          updatedAt: new Date().toISOString(),
          reason: `${updatedProduct.name} was updated by user`,
        },
      });

      await queryRunner.commitTransaction();
      return successResponse('Product updated successfully', updatedProduct);
    } catch (error) {
      await queryRunner.rollbackTransaction();

      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Failed to update product details.',
      );
    } finally {
      await queryRunner.release();
    }
  }

  async remove(
    id: string,
    user: AuthenticatedUser,
  ): Promise<ApiResponse<null>> {
    try {
      const product = await this.productRepository.findOne({
        where: { id, business_id: user.businessId, deleted_at: undefined },
      });

      if (!product) {
        throw new NotFoundException(
          `Product with ID "${id}" could not be found.`,
        );
      }

      if (product.images && product.images.length > 0) {
        for (const img of product.images) {
          await this.cloudinaryService.deleteImage(img.publicId);
        }
      }

      product.images = [];
      await this.productRepository.save(product);

      const deleted = await this.productRepository.softRemove(product);

      await this.auditLogService.create({
        action: AuditLogAction.DELETE,
        entity: AuditLogEntity.PRODUCT,
        entityId: product.id,
        oldValue: product,
        newValue: deleted,
        metadata: {
          productName: product.name,
          businessId: user.businessId,
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

  async getInventoryHealth(user: AuthenticatedUser): Promise<DashboardCard[]> {
    const queryBuilder = this.productRepository
      .createQueryBuilder('product')
      .where('product.deleted_at IS NULL')
      .andWhere('product.business_id = :businessId', {
        businessId: user.businessId,
      });

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
        value: Number(result?.totalProducts ?? 0),
        severity: 'success',
      },
      {
        id: 'stock',
        title: 'Total Stock',
        value: Number(result?.totalStock ?? 0),
        severity: 'success',
      },
      {
        id: 'low-stock',
        title: 'Low Stock',
        value: Number(result?.lowStock ?? 0),
        severity: Number(result?.lowStock) > 0 ? 'warning' : 'success',
        subtitle: 'Products below reorder level',
        action: {
          label: 'Create Purchase Requests',
          url: '/purchase-orders/create',
        },
      },
    ];
  }

  async getProductAuditLogs(
    productId: string,
    user: AuthenticatedUser,
    query: BasePaginationQueryDto,
  ): Promise<
    ApiResponse<{
      auditLogs: AuditLog[];
      meta: PaginationMeta;
    }>
  > {
    const product = await this.productRepository.findOne({
      where: { id: productId, business_id: user.businessId },
    });

    if (!product) {
      throw new NotFoundException(
        `Product with ID "${productId}" could not be found.`,
      );
    }

    return await this.auditLogService.getEntityAuditLogs(
      AuditLogEntity.PRODUCT,
      productId,
      query,
    );
  }
}
