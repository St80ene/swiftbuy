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

import { StoresService } from './stores.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';

import {
  PaginationMeta,
  StorePaginationQueryDto,
} from '../../common/dto/pagination-query.dto';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface';

import { ApiResponse } from '../../common/utils/response.utils';
import { Store } from './entities/store.entity';

@Controller('stores')
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Get()
  findAll(
    @CurrentUser() { businessId }: AuthenticatedUser,
    @Query() paginationQuery: StorePaginationQueryDto,
  ): Promise<
    ApiResponse<{
      stores: Store[];
      meta: PaginationMeta;
    }>
  > {
    return this.storesService.findAll(businessId, paginationQuery);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser() { businessId }: AuthenticatedUser,
  ): Promise<ApiResponse<Store>> {
    return this.storesService.findOne(id, businessId);
  }

  @Post()
  create(
    @Body() createStoreDto: CreateStoreDto,
    @CurrentUser() { businessId }: AuthenticatedUser,
  ): Promise<ApiResponse<Store>> {
    return this.storesService.create(createStoreDto, businessId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentUser() { businessId }: AuthenticatedUser,
    @Body() updateStoreDto: UpdateStoreDto,
  ): Promise<ApiResponse<Store>> {
    return this.storesService.update(id, businessId, updateStoreDto);
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @CurrentUser() { businessId }: AuthenticatedUser,
  ): Promise<ApiResponse<null>> {
    return this.storesService.remove(id, businessId);
  }
}
