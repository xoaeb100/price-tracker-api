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
    private readonly productsSvc: ProductsService,
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
    const products = await this.productsSvc.findAll();

    for (const p of products) {
      try {
        const { title, price, currency, imageUrl, url } =
          await this.scraper.scrape(p.platform, p.productId!);

        await this.productsSvc.updatePriceData(p.id, {
          title: title ?? p.title,
          currentPrice: price,
          url: url ?? p.url,

          currency: currency ?? p.currency,
          imageUrl: imageUrl ?? p.imageUrl,
          lastCheckedAt: new Date(),
        });
        if (typeof price === 'number' && price > 0) {
          await this.productsSvc.logPrice(p.id, price);
        }
        if (
          p.sendMail &&
          typeof price === 'number' &&
          !isNaN(price) &&
          price > 0
        ) {
          // Notify if price is lower than minPrice
          if (price <= p.minPrice) {
            await this.notifications.sendPriceDropEmail({
              platform: p.platform,
              title: title ?? p.title,
              url: p.url,
              currentPrice: price,
              minPrice: p.minPrice,
              imageUrl: imageUrl ?? undefined,
              customerEmail: p.customerEmail,
              messageType: 'PRICE_DROP',
            });
            this.logger.log(
              `Notified: ${p.url} @ ${price} (target ${p.minPrice})`,
            );
          }

          // Notify if price is higher than maxPrice
          if (p.maxPrice && price >= p.maxPrice) {
            await this.notifications.sendPriceDropEmail({
              platform: p.platform,
              title: title ?? p.title,
              url: p.url,
              currentPrice: price,
              minPrice: p.maxPrice,
              imageUrl: imageUrl ?? undefined,
              customerEmail: p.customerEmail,
              messageType: 'PRICE_HIGH', // optional: differentiate in email
            });
            this.logger.log(
              `Notified: ${p.url} @ ${price} (maxPrice ${p.maxPrice})`,
            );
          }

          if (!(price <= p.minPrice || (p.maxPrice && price >= p.maxPrice))) {
            this.logger.log(
              `Checked: ${p.url} => ${price} (target ${p.minPrice}, max ${p.maxPrice ?? 'n/a'})`,
            );
          }
        } else {
          this.logger.log(
            `Checked: ${p.url} => n/a (target ${p.minPrice}, max ${p.maxPrice ?? 'n/a'})`,
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

  getStatus() {
    if (this.schedulerRegistry.doesExist('interval', this.jobName)) {
      const interval = this.schedulerRegistry.getInterval(this.jobName);
      return {
        running: true,
        jobName: this.jobName,
        intervalMs: interval._idleTimeout, // ms value
        intervalSec: interval._idleTimeout / 1000,
      };
    }
    return { running: false, jobName: this.jobName };
  }
}
