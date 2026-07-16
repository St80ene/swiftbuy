import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ProductSourcesService } from './product_sources.service';
import { CreateProductSourceDto } from './dto/create-product_source.dto';
import { UpdateProductSourceDto } from './dto/update-product_source.dto';

@Controller('product-sources')
export class ProductSourcesController {
  constructor(private readonly productSourcesService: ProductSourcesService) {}

  @Post()
  create(@Body() createProductSourceDto: CreateProductSourceDto) {
    return this.productSourcesService.create(createProductSourceDto);
  }

  @Get()
  findAll() {
    return this.productSourcesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productSourcesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProductSourceDto: UpdateProductSourceDto) {
    return this.productSourcesService.update(+id, updateProductSourceDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productSourcesService.remove(+id);
  }
}
