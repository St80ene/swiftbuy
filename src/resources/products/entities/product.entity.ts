import {
  BaseEntity,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export interface ProductImage {
  url: string;
  publicId: string;
  isPrimary: boolean;
}

@Entity({ name: 'products' })
export class Product extends BaseEntity {
  constructor(props?: Partial<Product>) {
    super();
    if (props) {
      Object.assign(this, props);
    }
  }

  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ type: 'varchar', nullable: true })
  description?: string;

  @Column({ type: 'json', default: () => "('[]')" })
  images!: ProductImage[];

  @Column({ type: 'int', default: 0 })
  stock_quantity!: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0.0 })
  cost_price!: number;

  @Column('decimal', { precision: 10, scale: 2 })
  selling_price!: number;

  @Column({ type: 'varchar', nullable: true, default: '' })
  category?: string;

  @CreateDateColumn({
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt!: Date;

  @UpdateDateColumn({
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt!: Date;

  @DeleteDateColumn({
    type: 'datetime',
    nullable: true,
  })
  deletedAt!: Date | null;
}
