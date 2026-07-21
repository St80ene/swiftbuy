import { Test, TestingModule } from '@nestjs/testing';
import { StockService } from './stock.service';
import { DataSource } from 'typeorm';

export const mockDataSource = {
  createQueryRunner: jest.fn(),
  getRepository: jest.fn(),
};

describe('StockService', () => {
  let service: StockService;

  beforeEach(async () => {
    jest.resetAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StockService,
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<StockService>(StockService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
