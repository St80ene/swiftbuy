import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

import { StocksService } from './stock.service';
import { AdjustStockDto } from './entities/stock.entity';
import { StockPaginationQueryDto } from '../../common/dto/pagination-query.dto';

@Controller('stock')
export class StocksController {
  constructor(private readonly stockService: StocksService) {}

  /**
   * Get paginated stock records
   *
   * GET /stock
   */
  @Get()
  findAll(
    @CurrentUser() { businessId },
    @Query() paginationQuery: StockPaginationQueryDto,
  ) {
    return this.stockService.findAll(businessId as string, paginationQuery);
  }

  /**
   * Get a single stock record
   *
   * GET /stock/:id
   */
  @Get(':id')
  findOne(@CurrentUser() { businessId }, @Param('id') id: string) {
    return this.stockService.findOne(id, businessId as string);
  }

  /**
   * Get stock history for a product
   *
   * GET /stock/product/:productId/history
   */
  @Get('product/:productId/history')
  findProductStockHistory(
    @CurrentUser() { businessId },
    @Param('productId') productId: string,
  ) {
    return this.stockService.findProductStockHistory(
      productId,
      businessId as string,
    );
  }

  /**
   * Get current stock for a product
   *
   * GET /stock/product/:productId
   */
  @Get('product/:productId')
  findCurrentStock(
    @CurrentUser() { businessId },
    @Param('productId') productId: string,
  ) {
    return this.stockService.findCurrentStock(productId, businessId as string);
  }

  /**
   * Adjust stock for a single product
   *
   * POST /stock/adjust
   */
  @Post('adjust')
  adjustStock(
    @CurrentUser() { businessId, storeId },
    @Body() adjustStockDto: AdjustStockDto,
  ) {
    return this.stockService.adjustStock(
      businessId as string,
      storeId as string,
      adjustStockDto,
    );
  }

  /**
   * Adjust stock for multiple products
   *
   * POST /stock/bulk-adjust
   */
  @Post('bulk-adjust')
  bulkAdjustStock(
    @CurrentUser() { businessId, storeId },
    @Body() adjustStockDtos: AdjustStockDto[],
  ) {
    return this.stockService.bulkAdjustStock(
      businessId as string,
      storeId as string,
      adjustStockDtos,
    );
  }
}
