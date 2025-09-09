import { Module } from '@nestjs/common';
import { ScraperModule } from '../scraper/scraper.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PriceCheckerService } from './price-checker.service';
import { ProductsModule } from 'src/product/product.module';
import { PriceCheckerController } from './price-checker.controller';

@Module({
  imports: [ProductsModule, ScraperModule, NotificationsModule],
  providers: [PriceCheckerService],

  controllers: [PriceCheckerController],
})
export class PriceCheckerModule {}
