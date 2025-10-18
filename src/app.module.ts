import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';

import { ProductsModule } from './product/product.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ScraperModule } from './scraper/scraper.module';
import { PriceCheckerModule } from './price-checker/price-checker.module';

@Module({
  imports: [
    // Make env available everywhere
    ConfigModule.forRoot({
      isGlobal: true,
      // envFilePath: '.env', // uncomment if you use a non-default path
    }),

    // Schedule needs forRoot
    ScheduleModule.forRoot(),

    // Init TypeORM here (and ONLY here)
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const databaseUrl = config.get<string>('DATABASE_URL');
        if (!databaseUrl) {
          throw new Error('DATABASE_URL is not defined');
        }
        return {
          type: 'postgres',
          url: databaseUrl,
          ssl: { rejectUnauthorized: false },
          autoLoadEntities: true,
          synchronize: true, // dev only
        };
      },
    }),

    // Feature modules
    ProductsModule,
    NotificationsModule,
    ScraperModule,
    PriceCheckerModule,
  ],
})
export class AppModule {}
