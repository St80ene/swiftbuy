import { Module } from '@nestjs/common';
import { StocksService } from './stock.service';
import { StocksController } from './stock.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Stocks } from './entities/stock.entity';
@Module({
  imports: [TypeOrmModule.forFeature([Stocks])],
  controllers: [StocksController],
  providers: [StocksService],
})
export class StocksModule {}
