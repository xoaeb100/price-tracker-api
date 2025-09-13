import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';

export type Platform = 'amazon' | 'flipkart' | 'croma' | 'vijaysales';

@Entity('products')
export class Product extends BaseEntity {
  @Column({ type: 'text' })
  url!: string;

  @Column({ type: 'varchar', length: 20 })
  @Index()
  platform!: Platform;

  @Column({ type: 'text', nullable: true })
  title!: string | null;

  @Column({ type: 'numeric', nullable: true })
  currentPrice!: number | null;

  @Column({ type: 'numeric' })
  targetPrice!: number;

  @Column({ type: 'numeric' })
  maxPrice!: number;

  @Column({ type: 'timestamp', nullable: true })
  lastCheckedAt!: Date | null;

  @Column({ type: 'text', nullable: true })
  imageUrl!: string | null;

  @Column({ type: 'text', nullable: true })
  currency!: string | null;

  // Optional: multi-user support (null = single-user app)
  @Column({ type: 'text', nullable: true })
  userId!: string | null;

  @Column({ type: 'text', nullable: true })
  customerEmail!: string | null;
  @Column({ type: 'text', nullable: true })
  productId!: string | null;
}
