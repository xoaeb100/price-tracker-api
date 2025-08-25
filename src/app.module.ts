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
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: parseInt(config.get<string>('DB_PORT', '5432'), 10),
        username: config.get<string>('DB_USER', 'postgres'),
        password: config.get<string>('DB_PASS', 'postgres'),
        database: config.get<string>('DB_NAME', 'price_tracker'),
        autoLoadEntities: true,
        synchronize: true, // dev only; use migrations in prod
      }),
    }),

    // Feature modules
    ProductsModule,
    NotificationsModule,
    ScraperModule,
    PriceCheckerModule,
  ],
})
export class AppModule {}
