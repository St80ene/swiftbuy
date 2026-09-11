import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Stock } from './entities/stock.entity';
import { Product } from '../products/entities/product.entity';
import { StocksService } from './stock.service';
import { StocksController } from './stock.controller';
@Module({
  imports: [TypeOrmModule.forFeature([Stock, Product])],
  controllers: [StocksController],
  providers: [StocksService],
  exports: [StocksService],
})
export class StocksModule {}
