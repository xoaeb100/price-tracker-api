import { Test, TestingModule } from '@nestjs/testing';
import { PriceCheckerService } from './price-checker.service';

describe('PriceCheckerService', () => {
  let service: PriceCheckerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PriceCheckerService],
    }).compile();

    service = module.get<PriceCheckerService>(PriceCheckerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
