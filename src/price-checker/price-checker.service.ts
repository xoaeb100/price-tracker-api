import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ScraperService } from '../scraper/scraper.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ProductsService } from 'src/product/product.service';
import { SchedulerRegistry } from '@nestjs/schedule';

@Injectable()
export class PriceCheckerService {
  private readonly logger = new Logger(PriceCheckerService.name);
  private jobName = 'price-check-job';

  constructor(
    private readonly products: ProductsService,
    private readonly scraper: ScraperService,
    private readonly notifications: NotificationsService,
    private schedulerRegistry: SchedulerRegistry,
  ) {}

  // @Cron('0 * * * *')
  // async checkAll() {
  //   await this.runCheck();
  // }

  async runCheck() {
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

  start(intervalMs: number) {
    if (this.schedulerRegistry.doesExist('interval', this.jobName)) {
      this.stop();
    }

    const callback = () => this.runCheck();

    const interval = setInterval(callback, intervalMs);
    this.schedulerRegistry.addInterval(this.jobName, interval);

    this.logger.log(
      `Started price checker job: every ${intervalMs / 1000} seconds`,
    );
  }

  stop() {
    if (this.schedulerRegistry.doesExist('interval', this.jobName)) {
      this.schedulerRegistry.deleteInterval(this.jobName);
      this.logger.warn(`Stopped price checker job`);
    }
  }
}
