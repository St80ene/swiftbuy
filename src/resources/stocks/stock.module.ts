import { Module } from '@nestjs/common';
import { StocksService } from './stock.service';
import { StocksController } from './stock.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Stocks } from './entities/stock.entity';
import { Product } from '../products/entities/product.entity';
@Module({
  imports: [TypeOrmModule.forFeature([Stocks, Product])],
  controllers: [StocksController],
  providers: [StocksService],
  exports: [StocksService],
})
export class StocksModule {}
