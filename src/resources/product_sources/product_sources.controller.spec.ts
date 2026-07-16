import { Test, TestingModule } from '@nestjs/testing';
import { ProductSourcesController } from './product_sources.controller';
import { ProductSourcesService } from './product_sources.service';

describe('ProductSourcesController', () => {
  let controller: ProductSourcesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductSourcesController],
      providers: [ProductSourcesService],
    }).compile();

    controller = module.get<ProductSourcesController>(ProductSourcesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
