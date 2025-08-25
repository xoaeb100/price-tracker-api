import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product) private readonly repo: Repository<Product>,
  ) {}

  async create(dto: CreateProductDto) {
    const item = this.repo.create({
      url: dto.url,
      platform: dto.platform,
      targetPrice: dto.targetPrice,
      userId: dto.userId ?? null,
      currentPrice: null,
      title: null,
      imageUrl: null,
      currency: null,
      lastCheckedAt: null,
    });
    return this.repo.save(item);
  }

  findAll(userId?: string) {
    if (userId) {
      return this.repo.find({ where: { userId } });
    }
    return this.repo.find();
  }

  async findOne(id: string) {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Product not found');
    return item;
  }

  async update(id: string, dto: UpdateProductDto) {
    const item = await this.findOne(id);
    Object.assign(item, dto);
    return this.repo.save(item);
  }

  async remove(id: string) {
    const item = await this.findOne(id);
    await this.repo.remove(item);
    return { deleted: true };
  }

  async updatePriceData(id: string, data: Partial<Product>) {
    await this.repo.update({ id }, data);
    return this.findOne(id);
  }
}
