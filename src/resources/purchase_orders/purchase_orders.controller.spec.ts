import { Test, TestingModule } from '@nestjs/testing';
import { PurchaseOrdersController } from './purchase_orders.controller';
import { PurchaseOrdersService } from './purchase_orders.service';

describe('PurchaseOrdersController', () => {
  let controller: PurchaseOrdersController;
  const mockPurchaseOrdersService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PurchaseOrdersController],
      providers: [
        PurchaseOrdersController,
        {
          provide: PurchaseOrdersService,
          useValue: mockPurchaseOrdersService,
        },
      ],
    }).compile();

    controller = module.get<PurchaseOrdersController>(PurchaseOrdersController);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
