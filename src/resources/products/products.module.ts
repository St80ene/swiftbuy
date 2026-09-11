import { Module } from '@nestjs/common';
import { AuditLogsModule } from '../audit_logs/audit_logs.module';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { CloudinaryService } from '../../common/utils/helpers/cloudinary/cloudinary.service';
import { Stock } from '../stocks/entities/stock.entity';
import { StockMovement } from '../stock_movements/entities/stock_movement.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, Stock, StockMovement]),
    AuditLogsModule,
  ],
  providers: [ProductsService, CloudinaryService],
  controllers: [ProductsController],
  exports: [ProductsService],
})
export class ProductsModule {}
