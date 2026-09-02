import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BusinessesService } from './business.service';
import { BusinessController } from './business.controller';
import { Business } from './entities/business.entity';
import { CloudinaryService } from '../../common/utils/helpers/cloudinary/cloudinary.service';

@Module({
  imports: [TypeOrmModule.forFeature([Business])],
  controllers: [BusinessController],
  providers: [BusinessesService, CloudinaryService],
})
export class BusinessesModule {}
