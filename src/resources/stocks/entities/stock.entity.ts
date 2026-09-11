import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

import { Product } from '../../products/entities/product.entity';
import { Business } from '../../business/entities/business.entity';
import { Store } from '../../stores/entities/store.entity';
import {
  StockMovement,
  StockMovementDirection,
  StockMovementReferenceType,
  StockMovementType,
} from '../../stock_movements/entities/stock_movement.entity';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

@Entity('stocks')
@Unique('UQ_stock_product_store', ['product_id', 'store_id'])
export class Stock extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /**
   * The product this stock balance belongs to.
   */
  @Column({ type: 'varchar', length: 36 })
  product_id!: string;

  /**
   * Business tenant boundary.
   */
  @Column({ type: 'varchar', length: 36 })
  business_id!: string;

  /**
   * Store where this stock is physically held.
   */
  @Column({ type: 'varchar', length: 36 })
  store_id!: string;

  /**
   * Current stock balance in the product's base UOM.
   *
   * Examples:
   * - pcs → 25
   * - g   → 5000
   * - ml  → 2500
   */
  @Column({ type: 'int', default: 0 })
  quantity!: number;

  /**
   * Quantity at or below which the product is considered low stock
   * for this particular store.
   */
  @Column({ type: 'int', default: 5 })
  reorder_level!: number;

  @ManyToOne(() => Product, (product) => product.stocks, {
    nullable: false,
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'product_id' })
  product!: Product;

  @ManyToOne(() => Business, (business) => business.stocks, {
    nullable: false,
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'business_id' })
  business!: Business;

  @ManyToOne(() => Store, (store) => store.stocks, {
    nullable: false,
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'store_id' })
  store!: Store;

  @OneToMany(() => StockMovement, (movement) => movement.stock)
  movements!: StockMovement[];

  @CreateDateColumn({
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
  })
  created_at!: Date;

  @UpdateDateColumn({
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updated_at!: Date;
}

export class AdjustStockDto {
  @IsUUID()
  @IsNotEmpty()
  product_id!: string;

  @IsEnum(StockMovementType)
  type!: StockMovementType;

  @IsEnum(StockMovementDirection)
  direction!: StockMovementDirection;

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  quantity!: number;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsEnum(StockMovementReferenceType)
  reference_type?: StockMovementReferenceType;

  @IsOptional()
  @IsUUID()
  reference_id?: string;
}
