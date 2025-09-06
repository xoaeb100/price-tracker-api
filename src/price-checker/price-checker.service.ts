import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ScraperService } from '../scraper/scraper.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ProductsService } from 'src/product/product.service';

@Injectable()
export class PriceCheckerService {
  private readonly logger = new Logger(PriceCheckerService.name);

  @Cron('* * * * *')
  async checkAll() {
    this.logger.log('Running scheduled price check...');
    const products = await this.products.findAll();
    for (const p of products) {
      try {
        const { title, price, currency, imageUrl } = await this.scraper.scrape(
          p.url,
          p.platform,
        );

        // Update DB with fresh data
        await this.products.updatePriceData(p.id, {
          title: title ?? p.title,
          currentPrice: price,
          currency: currency ?? p.currency,
          imageUrl: imageUrl ?? p.imageUrl,
          lastCheckedAt: new Date(),
        });

        // Notify if target reached
        if (typeof price === 'number' && price <= p.targetPrice) {
          await this.notifications.sendPriceDropEmail({
            platform: p.platform,
            title: title ?? p.title,
            url: p.url,
            currentPrice: price,
            targetPrice: p.targetPrice,
            imageUrl: imageUrl ?? undefined,
            customerEmail: p.customerEmail,
          });
          this.logger.log(
            `Notified: ${p.url} @ ${price} (target ${p.targetPrice})`,
          );
        } else {
          this.logger.log(
            `Checked: ${p.url} => ${price ?? 'n/a'} (target ${p.targetPrice})`,
          );
        }
      } catch (err: any) {
        this.logger.error(`Failed to check ${p.url}: ${err.message}`);
      }
    }
  }

  constructor(
    private readonly products: ProductsService,
    private readonly scraper: ScraperService,
    private readonly notifications: NotificationsService,
  ) {}
}
