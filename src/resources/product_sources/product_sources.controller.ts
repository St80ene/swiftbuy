import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ProductSourcesService } from './product_sources.service';
import { CreateProductSourceDto } from './dto/create-product_source.dto';
import { UpdateProductSourceDto } from './dto/update-product_source.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

@Controller('product-sources')
export class ProductSourcesController {
  constructor(private readonly productSourcesService: ProductSourcesService) {}

  @Post()
  create(@Body() createProductSourceDto: CreateProductSourceDto) {
    return this.productSourcesService.create(createProductSourceDto);
  }

  @Get()
  findAll(@Query() query: PaginationQueryDto) {
    return this.productSourcesService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.productSourcesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateProductSourceDto: UpdateProductSourceDto,
  ) {
    return this.productSourcesService.update(id, updateProductSourceDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.productSourcesService.remove(id);
  }
}
