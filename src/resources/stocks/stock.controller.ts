import { StockService } from './stock.service';
import { CreateStockDto } from './dto/create-stock.dto';
import { Controller, Get, Post, Body, Req } from '@nestjs/common';
import { AdjustStockDto } from './entities/stock.entity';

@Controller('stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Post('adjust')
  adjustStock(@Req() req: any, @Body() adjustStockDto: CreateStockDto) {
    return this.stockService.adjustStock(adjustStockDto);
  }

  @Get('ledger')
  getLedger(@Req() req: AdjustStockDto) {
    return this.stockService.getLedgerLogs(req);
  }
}
