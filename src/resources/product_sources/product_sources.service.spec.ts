import { Test, TestingModule } from '@nestjs/testing';
import { ProductSourcesService } from './product_sources.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProductSource } from './entities/product_source.entity';

describe('ProductSourcesService', () => {
  let service: ProductSourcesService;

  const mockProductSourcesRepository = {
    create: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductSourcesService,
        {
          provide: getRepositoryToken(ProductSource),
          useValue: mockProductSourcesRepository,
        },
      ],
    }).compile();

    service = module.get<ProductSourcesService>(ProductSourcesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
