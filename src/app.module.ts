import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { mySqLDataSourceOptions } from './database/config/appDataSource';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { BusinessesModule } from './resources/business/business.module';
import { StocksModule } from './resources/stocks/stock.module';
import { UsersModule } from './resources/users/users.module';
import { ProductsModule } from './resources/products/products.module';
import { CloudinaryModule } from './utils/helpers/cloudinary/cloudinary.module';
import { PurchaseOrdersModule } from './resources/purchase_orders/purchase_orders.module';
import { SuppliersModule } from './resources/suppliers/suppliers.module';
import { ProductSourcesModule } from './resources/product_sources/product_sources.module';
import { ScheduleModule } from '@nestjs/schedule';
import { AuditLogsModule } from './resources/audit_logs/audit_logs.module';
import { AuthModule } from './auth/auth.module';
import { DashboardModule } from './resources/dashboard/dashboard.module';
import { ReportsModule } from './resources/reports/reports.module';
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
      ...mySqLDataSourceOptions,
      autoLoadEntities: true,
    }),
    ProductsModule,
    BusinessesModule,
    UsersModule,
    StocksModule,
    CloudinaryModule,
    PurchaseOrdersModule,
    ProductSourcesModule,
    SuppliersModule,
    ScheduleModule.forRoot(),
    AuditLogsModule,
    AuthModule,
    DashboardModule,
    ReportsModule,
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
