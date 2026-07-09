import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  DefaultValuePipe,
  UseInterceptors,
  ParseIntPipe,
  ParseUUIDPipe,
  UploadedFile,
} from '@nestjs/common';
// import { ApiConsumes, ApiBody } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('image'))
  // @ApiConsumes('multipart/form-data') // Enforces format layout in Swagger UI docs
  // @ApiBody({
  //   schema: {
  //     type: 'object',
  //     properties: {
  //       name: { type: 'string' },
  //       price: { type: 'number' },
  //       description: { type: 'string' },
  //       stock_quantity: { type: 'number' },
  //       category: { type: 'string' },
  //       image: { type: 'string', format: 'binary' }, // 👈 Creates a clean file selector upload button in your API docs dashboard
  //     },
  //   },
  // })
  create(
    @Body() createProductDto: CreateProductDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.productsService.create(createProductDto, file);
  }

  @Get()
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.productsService.findAll({ page, limit });
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    // <-- Ensures it's a valid UUID structure
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('image'))
  update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @UploadedFile() file?: Express.Multer.File, // 👈 Capture the optional new file
  ) {
    return this.productsService.update(id, updateProductDto, file);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    // <-- Ensures it's a valid UUID structure
    return this.productsService.remove(id);
  }
}
