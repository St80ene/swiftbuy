import { Test, TestingModule } from '@nestjs/testing';
import { PurchaseOrdersService } from './purchase_orders.service';

describe('PurchaseOrdersService', () => {
  let service: PurchaseOrdersService;
  const mockPurchaseOrdersRepository = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PurchaseOrdersService,
        {
          provide: PurchaseOrdersService,
          useValue: mockPurchaseOrdersRepository,
        },
      ],
    }).compile();

    service = module.get<PurchaseOrdersService>(PurchaseOrdersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
