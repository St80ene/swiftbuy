import { StockService } from './stock.service';
import { CreateStockDto } from './dto/create-stock.dto';
import { Controller, Get, Post, Body, Req, Query } from '@nestjs/common';

@Controller('stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Post('adjust')
  adjustStock(@Req() req: any, @Body() adjustStockDto: CreateStockDto) {
    return this.stockService.adjustStock(adjustStockDto);
  }

  @Get('ledger')
  getLedger(@Req() req: any, @Query('product_id') productId?: string) {
    return this.stockService.getLedgerLogs(productId);
  }
}
