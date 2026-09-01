import {
  BaseEntity,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CloudinaryImage } from '../../../utils/helpers/cloudinary/cloudinary.service';
import { IsEnum } from 'class-validator';
import { ProductSource } from '../../product_sources/entities/product_source.entity';
import { Stocks } from '../../stocks/entities/stock.entity';
import { Category } from '../../categories/entities/category.entity';
import { Business } from '../../business/entities/business.entity';

export enum UomType {
  UNIT = 'UNIT',
  WEIGHT = 'WEIGHT',
  VOLUME = 'VOLUME',
}

export enum UomBaseName {
  PCS = 'pcs',
  G = 'g',
  ML = 'ml',
}

export enum ProductStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ARCHIVED = 'ARCHIVED',
}

export enum UomDisplayName {
  PCS = 'pcs',
  G = 'g',
  KG = 'kg',
  ML = 'ml',
  L = 'L',
}

@Entity({ name: 'products' })
export class Product extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ type: 'varchar', nullable: true })
  description?: string;

  @Column({ type: 'json', default: () => "('[]')" })
  images!: CloudinaryImage[];

  @Column({ type: 'int', default: 0 })
  stock_quantity!: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0.0 })
  cost_price!: number;

  @Column('decimal', { precision: 10, scale: 2 })
  selling_price!: number;

  @Column({ type: 'int', default: 5 })
  reorder_level!: number;

  @IsEnum(UomType, {
    message: 'Invalid UOM type. Must be one of: UNIT, WEIGHT, VOLUME.',
  })
  @Column({ type: 'varchar', length: 20, default: UomType.UNIT })
  uom_type!: UomType; // 'UNIT', 'WEIGHT', 'VOLUME'

  @IsEnum(UomBaseName, {
    message: 'Invalid UOM base name. Must be one of: pcs, g, ml.',
  })
  @Column({ type: 'varchar', length: 10, default: UomBaseName.PCS })
  uom_base_name!: UomBaseName; // 'pcs', 'g', 'ml'

  @IsEnum(UomDisplayName, {
    message: 'Invalid UOM display name. Must be one of: pcs, kg, L.',
  })
  @Column({ type: 'varchar', length: 10, default: UomDisplayName.PCS })
  uom_display_name!: UomDisplayName; // 'pcs', 'kg', 'L'

  /**
   * Product lifecycle status.
   *
   * ACTIVE:
   * Product is currently available for normal operations.
   *
   * INACTIVE:
   * Product is temporarily unavailable but still exists.
   *
   * ARCHIVED:
   * Product has been permanently discontinued from normal operations.
   */
  @IsEnum(ProductStatus, {
    message:
      'Invalid product status. Must be one of: ACTIVE, INACTIVE, ARCHIVED.',
  })
  @Column({
    type: 'varchar',
    // enum: ProductStatus,
    default: ProductStatus.INACTIVE,
  })
  status!: ProductStatus;

  // Bidirectional link: Let's us do: productRepository.find({ relations: { source: true } })
  @OneToOne(() => ProductSource, (source) => source.product)
  source!: ProductSource;

  @OneToOne(() => Stocks, (stock) => stock.product)
  stock!: Stocks;

  @Column({ type: 'char', length: 36, nullable: true })
  category_id?: string;

  @Column({ type: 'char', length: 36, nullable: true })
  business_id?: string;

  @ManyToOne(() => Category, (category) => category.products, {
    nullable: true,
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'category_id' })
  category?: Category;

  @ManyToOne(() => Business, (business) => business.products, {
    nullable: true,
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'business_id' })
  business?: Business;

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
  updated_at!: Date;

  @DeleteDateColumn({
    type: 'datetime',
    nullable: true,
  })
  deleted_at!: Date | null;
}
