import { Module } from '@nestjs/common';
import { PurchaseOrdersService } from './purchase_orders.service';
import { PurchaseOrdersController } from './purchase_orders.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PurchaseOrder } from './entities/purchase_order.entity';
import { ProductSource } from '../product_sources/entities/product_source.entity';
import { Product } from '../products/entities/product.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PurchaseOrder, ProductSource, Product])],
  controllers: [PurchaseOrdersController],
  providers: [PurchaseOrdersService],
})
export class PurchaseOrdersModule {}
