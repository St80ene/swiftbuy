import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { mockCloudinaryService } from '../companies/companies.service.spec';
import { CloudinaryService } from '../../utils/helpers/cloudinary/cloudinary.service';
import { mockDataSource } from '../stocks/stock.service.spec';
import { DataSource } from 'typeorm';

describe('ProductsService', () => {
  let service: ProductsService;

  const mockProductRepository = {
    create: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: getRepositoryToken(Product),
          useValue: mockProductRepository,
        },
        {
          provide: CloudinaryService,
          useValue: mockCloudinaryService,
        },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
