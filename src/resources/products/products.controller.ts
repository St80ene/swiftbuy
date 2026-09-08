import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseInterceptors,
  ParseUUIDPipe,
  UploadedFiles,
  HttpStatus,
  ParseFilePipeBuilder,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  PaginationMeta,
  ProductPaginationQueryDto,
} from '../../common/dto/pagination-query.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface';
import { ApiResponse } from '../../common/utils/response.utils';
import { AuditLog } from '../audit_logs/entities/audit_log.entity';
import { Product } from './entities/product.entity';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UseInterceptors(FilesInterceptor('images', 5)) // ◄ Allow up to 5 images
  create(
    @Body() createProductDto: CreateProductDto,
    @CurrentUser() currentUser: AuthenticatedUser,
    @UploadedFiles(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({ fileType: /(jpg|jpeg|png|webp)$/ })
        .addMaxSizeValidator({ maxSize: 5 * 1024 * 1024 }) // 5MB
        .build({
          fileIsRequired: false,
          errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        }),
    )
    files?: Express.Multer.File[],
  ): Promise<ApiResponse<Product>> {
    return this.productsService.create(createProductDto, currentUser, files);
  }

  @Get()
  findAll(
    @Query() paginationQuery: ProductPaginationQueryDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<ApiResponse<{ products: Product[]; meta: PaginationMeta }>> {
    return this.productsService.findAll(paginationQuery, currentUser);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<ApiResponse<Product>> {
    return this.productsService.findOne(id, currentUser);
  }

  @Get(':id/audit-logs')
  getProductAuditLogs(
    @Param('id', ParseUUIDPipe) productId: string,
    @Query() query: ProductPaginationQueryDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<
    ApiResponse<{
      auditLogs: AuditLog[];
      meta: PaginationMeta;
    }>
  > {
    return this.productsService.getProductAuditLogs(
      productId,
      currentUser,
      query,
    );
  }

  @Get('inventory-health')
  getInventoryHealth(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.productsService.getInventoryHealth(currentUser);
  }

  @Patch(':id')
  @UseInterceptors(FilesInterceptor('images', 5))
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProductDto: UpdateProductDto,
    @CurrentUser() currentUser: AuthenticatedUser,
    @UploadedFiles() files?: Express.Multer.File[],
  ): Promise<ApiResponse<Product>> {
    return this.productsService.update(
      id,
      updateProductDto,
      currentUser,
      files,
    );
  }

  @Delete(':id')
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<ApiResponse<null>> {
    return this.productsService.remove(id, currentUser);
  }
}
