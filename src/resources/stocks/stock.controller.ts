import { StocksService } from './stock.service';
import { Controller, Get, Post, Body, Req } from '@nestjs/common';
import { AdjustStockDto } from './entities/stock.entity';

@Controller('stock')
export class StocksController {
  constructor(private readonly stockService: StocksService) {}

  @Post('adjust')
  adjustStock(@Req() req: any, @Body() adjustStockDto: AdjustStockDto) {
    return this.stockService.adjustStock(adjustStockDto);
  }

  @Get('ledger')
  getLedger(@Req() req: any) {
    return this.stockService.getLedgerLogs(req);
  }
}
