import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { Dashboard } from './entities/dashboard.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsModule } from '../products/products.module';
import { PurchaseOrdersModule } from '../purchase_orders/purchase_orders.module';
import { StocksModule } from '../stocks/stock.module';

@Module({
  imports: [
    ProductsModule,
    PurchaseOrdersModule,
    StocksModule,
    TypeOrmModule.forFeature([Dashboard]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [TypeOrmModule.forFeature([Dashboard])],
})
export class DashboardModule {}
