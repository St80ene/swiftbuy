import { Controller, Get, Param, Query } from '@nestjs/common';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface';

import { StocksService } from './stock.service';

import { StockPaginationQueryDto } from '../../common/dto/pagination-query.dto';

@Controller('stock')
export class StocksController {
  constructor(private readonly stockService: StocksService) {}

  /**
   * Get paginated current stock balances.
   *
   * GET /stock
   *
   * This returns CURRENT inventory balances.
   * It does not return the stock movement ledger.
   */
  @Get()
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() paginationQuery: StockPaginationQueryDto,
  ) {
    return this.stockService.findAll(user, paginationQuery);
  }

  /**
   * Get a single current stock balance.
   *
   * GET /stock/:id
   */
  @Get(':id')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.stockService.findOne(id, user);
  }

  /**
   * Get inventory/warehouse metrics.
   *
   * GET /stock/metrics
   */
  @Get('metrics')
  getWarehouseMetrics(@CurrentUser() user: AuthenticatedUser) {
    return this.stockService.getWarehouseMetrics(user);
  }
}
