import { Controller } from '@nestjs/common';
import { PriceCheckerService } from './price-checker.service';

@Controller('price-checker')
export class PriceCheckerController {
  constructor(private readonly priceCheckerService: PriceCheckerService) {}
}
