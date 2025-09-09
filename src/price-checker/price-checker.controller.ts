import { Body, Controller, Post } from '@nestjs/common';
import { PriceCheckerService } from './price-checker.service';

@Controller('price-checker')
export class PriceCheckerController {
  constructor(private readonly priceCheckerService: PriceCheckerService) {}

  @Post('start')
  start(@Body('minutes') minutes: number) {
    const intervalMs = minutes * 60 * 1000;
    this.priceCheckerService.start(intervalMs);
    return { message: `Started price checker every ${minutes} minutes` };
  }

  @Post('stop')
  stop() {
    this.priceCheckerService.stop();
    return { message: 'Stopped price checker' };
  }

  @Post('run')
  runOnce() {
    this.priceCheckerService.runCheck();
    return { message: 'Ran price checker once' };
  }
}
