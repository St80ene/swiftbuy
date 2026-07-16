import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { dataSourceOptions } from './database/config/appDataSource';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { CompaniesModule } from './resources/companies/companies.module';
import { StockModule } from './resources/stocks/stock.module';
import { UsersModule } from './resources/users/users.module';
import { ProductsModule } from './resources/products/products.module';
import { CloudinaryModule } from './utils/helpers/cloudinary/cloudinary.module';
import { PurchaseOrdersModule } from './resources/purchase_orders/purchase_orders.module';
import { SuppliersModule } from './resources/suppliers/suppliers.module';
import { ProductSourcesModule } from './resources/product_sources/product_sources.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // Time-to-live window in milliseconds (e.g., 1 minute)
        limit: 100, // Maximum requests allowed per IP within the ttl window
      },
    ]),
    TypeOrmModule.forRoot({
      ...dataSourceOptions,
      autoLoadEntities: true,
    }),
    ProductsModule,
    CompaniesModule,
    UsersModule,
    StockModule,
    CloudinaryModule,
    PurchaseOrdersModule,
    ProductSourcesModule,
    SuppliersModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard, // Automatically applies the limiter guard to EVERY route
    },
  ],
})
export class AppModule {}
