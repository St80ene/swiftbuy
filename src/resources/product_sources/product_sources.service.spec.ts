import { Test, TestingModule } from '@nestjs/testing';
import { ProductSourcesService } from './product_sources.service';

describe('ProductSourcesService', () => {
  let service: ProductSourcesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProductSourcesService],
    }).compile();

    service = module.get<ProductSourcesService>(ProductSourcesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
