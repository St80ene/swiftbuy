import { Test, TestingModule } from '@nestjs/testing';
import { SuppliersService } from './suppliers.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Supplier } from './entities/supplier.entity';

describe('SuppliersService', () => {
  let service: SuppliersService;
  const mockSuppliersRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(), // Needed for update operations in TypeORM
    remove: jest.fn(),
    merge: jest.fn(),
    softDelete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SuppliersService,
        {
          provide: getRepositoryToken(Supplier),
          useValue: mockSuppliersRepository,
        },
      ],
    }).compile();

    service = module.get<SuppliersService>(SuppliersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
