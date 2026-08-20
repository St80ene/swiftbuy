import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { SuppliersService } from './suppliers.service';
import { SuppliersController } from './suppliers.controller';
import { Supplier } from './entities/supplier.entity';
import { ProductSource } from '../product_sources/entities/product_source.entity';
import { Product } from '../products/entities/product.entity';
import { PurchaseOrder } from '../purchase_orders/entities/purchase_order.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Supplier, ProductSource, Product, PurchaseOrder]),
  ],
  controllers: [SuppliersController],
  providers: [SuppliersService],
  exports: [SuppliersService],
})
export class SuppliersModule {}
