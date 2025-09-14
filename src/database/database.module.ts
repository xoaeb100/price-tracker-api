import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '../config/config.service';
import { DatabaseService } from './database.service';
import { Product } from '../product/product.entity';
import { ProductHistory } from 'src/product/productHistory.enitity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        type: 'postgres',
        host: cfg.getString('DB_HOST', 'localhost'),
        port: cfg.getNumber('DB_PORT', 5432),
        username: cfg.getString('DB_USER', 'postgres'),
        password: cfg.getString('DB_PASS', 'admin'),
        database: cfg.getString('DB_NAME', 'price_tracker'),
        entities: [Product, ProductHistory],
        synchronize: true, // For dev only; use migrations in prod
        logging: false,
      }),
    }),
  ],
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {}
