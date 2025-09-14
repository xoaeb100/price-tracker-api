import {
  Column,
  Entity,
  Index,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { Product } from './product.entity';

export type Platform = 'amazon' | 'flipkart' | 'croma' | 'vijaysales';

@Entity('product_history')
export class ProductHistory extends BaseEntity {
  @OneToMany(() => ProductHistory, (productHistory) => productHistory.product)
  @JoinColumn({ name: 'productId' })
  product!: Product;

  @Column({ type: 'uuid' })
  @Index()
  productId!: string;

  @Column({ type: 'text' })
  url!: string;

  @Column({ type: 'varchar', length: 20 })
  platform!: Platform;

  @Column({ type: 'text', nullable: true })
  title!: string | null;

  @Column({ type: 'numeric', nullable: true })
  price!: number | null;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  checkedAt!: Date;

  @Column({ type: 'text', nullable: true })
  imageUrl!: string | null;

  @Column({ type: 'text', nullable: true })
  currency!: string | null;

  // Optional multi-user support
  @Column({ type: 'text', nullable: true })
  userId!: string | null;

  @Column({ type: 'text', nullable: true })
  customerEmail!: string | null;
}
