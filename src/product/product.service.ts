import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductHistory } from './productHistory.enitity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product) private readonly repo: Repository<Product>,
    @InjectRepository(ProductHistory)
    private readonly historyRepo: Repository<ProductHistory>,
  ) {}

  async create(dto: CreateProductDto) {
    const item = this.repo.create({
      url: this.ensureHttps(dto.url),
      platform: dto.platform,
      productId: dto.productId,
      minPrice: dto.minPrice,
      userId: dto.userId ?? null,
      currentPrice: null,
      maxPrice: dto.maxPrice,
      title: null,
      imageUrl: null,
      currency: null,
      lastCheckedAt: null,
      customerEmail: dto.customerEmail,
      sendMail: dto.sendMail ?? true,
    });

    return this.repo.save(item);
  }
  async updatePriceData(id: string, data: Partial<Product>) {
    // Update product
    await this.repo.update({ id }, data);
    const updated = await this.findOne(id);

    // Log history
    await this.historyRepo.save({
      productId: updated.id,
      url: updated.url,
      platform: updated.platform,
      title: updated.title,
      price: updated.currentPrice,
      currency: updated.currency,
      imageUrl: updated.imageUrl,
      checkedAt: new Date(),
      userId: updated.userId,
      customerEmail: updated.customerEmail,
    });

    return updated;
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
    const product = await this.repo.findOne({ where: { id } });
    if (!product) throw new Error('Product not found');
    return this.repo.remove(product);
  }

  ensureHttps(url) {
    if (!url.startsWith('https://')) {
      return 'https://' + url;
    }
    return url;
  }
}
