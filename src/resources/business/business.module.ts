import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BusinessesService } from './business.service';
import { BusinessController } from './business.controller';
import { CloudinaryService } from '../../utils/helpers/cloudinary/cloudinary.service';
import { Business } from './entities/business.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Business])],
  controllers: [BusinessController],
  providers: [BusinessesService, CloudinaryService],
})
export class BusinessesModule {}
