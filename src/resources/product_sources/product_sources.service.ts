import { Injectable } from '@nestjs/common';
import { CreateProductSourceDto } from './dto/create-product_source.dto';
import { UpdateProductSourceDto } from './dto/update-product_source.dto';

@Injectable()
export class ProductSourcesService {
  create(createProductSourceDto: CreateProductSourceDto) {
    return 'This action adds a new productSource';
  }

  findAll() {
    return `This action returns all productSources`;
  }

  findOne(id: number) {
    return `This action returns a #${id} productSource`;
  }

  update(id: number, updateProductSourceDto: UpdateProductSourceDto) {
    return `This action updates a #${id} productSource`;
  }

  remove(id: number) {
    return `This action removes a #${id} productSource`;
  }
}
