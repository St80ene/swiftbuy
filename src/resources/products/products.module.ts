import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { CloudinaryService } from '../../utils/helpers/cloudinary.service';

@Module({
  imports: [TypeOrmModule.forFeature([Product])],
  providers: [ProductsService, CloudinaryService],
  controllers: [ProductsController],
})
export class ProductsModule {}
