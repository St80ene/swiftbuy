import { Test, TestingModule } from '@nestjs/testing';
import { ProductSourcesController } from './product_sources.controller';
import { ProductSourcesService } from './product_sources.service';

describe('ProductSourcesController', () => {
  let controller: ProductSourcesController;

  const mockProductSourcesService = {
    create: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductSourcesController],
      providers: [
        {
          provide: ProductSourcesService,
          useValue: mockProductSourcesService,
        },
      ],
    }).compile();

    controller = module.get<ProductSourcesController>(ProductSourcesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
