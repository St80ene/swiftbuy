import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

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

  @Column({ nullable: true })
  description!: string;

  @Column({ nullable: true, default: '' })
  image_url!: string;

  @Column({ nullable: true, default: 0 })
  stock_quantity!: number;

  @Column('decimal', { precision: 10, scale: 2 })
  price!: number;

  @Column({ nullable: true, default: '' })
  category!: string;

  @CreateDateColumn({
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt!: Date;

  // Automatically updates the timestamp every time the row is modified
  @UpdateDateColumn({
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt!: Date;
}
