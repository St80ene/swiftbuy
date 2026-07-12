import { Module } from '@nestjs/common';
import { StockService } from './stock.service';
import { StockController } from './stock.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Stocks } from './entities/stock.entity';
@Module({
  imports: [TypeOrmModule.forFeature([Stocks])],
  controllers: [StockController],
  providers: [StockService],
})
export class StockModule {}
