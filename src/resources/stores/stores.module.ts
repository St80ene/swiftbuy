import { Module } from '@nestjs/common';
import { StoresService } from './stores.service';
import { StoresController } from './stores.controller';
import { Store } from './entities/store.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Business } from '../business/entities/business.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Store]), Business],
  controllers: [StoresController],
  providers: [StoresService],
  exports: [StoresService],
})
export class StoresModule {}
