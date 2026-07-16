import { Module } from '@nestjs/common';
import { ProductSourcesService } from './product_sources.service';
import { ProductSourcesController } from './product_sources.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductSource } from './entities/product_source.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ProductSource])],
  controllers: [ProductSourcesController],
  providers: [ProductSourcesService],
})
export class ProductSourcesModule {}
