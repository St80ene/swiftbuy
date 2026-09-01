import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { BasePaginationQueryDto } from '../../common/dto/pagination-query.dto';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(createCategoryDto);
  }

  @Get(':businessId')
  findAll(
    @Param('businessId') businessId: string,
    @Query() paginationQuery: BasePaginationQueryDto,
  ) {
    return this.categoriesService.findAll(businessId, paginationQuery);
  }

  @Get(':id/:businessId')
  findOne(@Param('id') id: string, @Param('businessId') businessId: string) {
    return this.categoriesService.findOne(id, businessId);
  }

  @Patch(':id/:businessId')
  update(
    @Param('id') id: string,
    @Param('businessId') businessId: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(id, businessId, updateCategoryDto);
  }

  @Delete(':id/:businessId')
  remove(@Param('id') id: string, @Param('businessId') businessId: string) {
    return this.categoriesService.remove(id, businessId);
  }
}
