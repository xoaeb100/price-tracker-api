import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './product.entity';
import { ProductsService } from './product.service';
import { ProductsController } from './product.controller';
import { ProductHistory } from './productHistory.enitity';

@Module({
  imports: [TypeOrmModule.forFeature([Product, ProductHistory])],
  providers: [ProductsService],
  controllers: [ProductsController],
  exports: [ProductsService],
})
export class ProductsModule {}
