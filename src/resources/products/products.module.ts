import { Module } from '@nestjs/common';
import { AuditLogsModule } from '../audit_logs/audit_logs.module';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { CloudinaryService } from '../../utils/helpers/cloudinary/cloudinary.service';

@Module({
  imports: [TypeOrmModule.forFeature([Product]), AuditLogsModule],
  providers: [ProductsService, CloudinaryService],
  controllers: [ProductsController],
  exports: [ProductsService],
})
export class ProductsModule {}
