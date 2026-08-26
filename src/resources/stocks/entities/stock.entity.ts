import { Type } from 'class-transformer';
import { IsUUID, IsNotEmpty, IsEnum, Min, IsNumber } from 'class-validator';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { OneToOne } from 'typeorm';
import { Product } from '../../products/entities/product.entity';

// Core Ledger Flow Enums
export enum MutationType {
  INFLOW = 'INFLOW',
  OUTFLOW = 'OUTFLOW',
}

export enum MutationReason {
  SUPPLIER_RESTOCK = 'SUPPLIER_RESTOCK',
  CUSTOMER_SALE = 'CUSTOMER_SALE',
  STOLEN = 'STOLEN',
  DAMAGED = 'DAMAGED',
  EXPIRED = 'EXPIRED',
  AUDIT_CORRECTION = 'AUDIT_CORRECTION',
  NEW_PRODUCT_INITIALIZATION = 'NEW_PRODUCT_INITIALIZATION',
}

@Entity({ name: 'stocks' })
export class Stocks extends BaseEntity {
  constructor(props?: Partial<Stocks>) {
    super();
    if (props) {
      Object.assign(this, props);
    }
  }

  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 36 })
  product_id!: string;

  @Column({
    type: 'varchar',
    default: MutationType.INFLOW,
  })
  type!: MutationType;

  @Column({
    type: 'varchar',
    default: MutationReason.SUPPLIER_RESTOCK,
  })
  reason!: MutationReason;

  @Column({ type: 'int' })
  quantity!: number;

  @Column('decimal', { precision: 10, scale: 2 })
  unit_cost_price!: number;

  @Column('decimal', {
    name: 'unit_selling_price',
    precision: 10,
    scale: 2,
    default: 0.0,
  })
  unit_selling_price!: number;

  @OneToOne(() => Product, (product) => product.stock, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_id' })
  product!: Product;

  @CreateDateColumn({
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt!: Date;
}

export class AdjustStockDto {
  @IsUUID()
  @IsNotEmpty()
  product_id!: string;

  @IsEnum(MutationType)
  @IsNotEmpty()
  type!: MutationType; // INFLOW or OUTFLOW

  @IsEnum(MutationReason)
  @IsNotEmpty()
  reason!: MutationReason; // e.g., STOLEN, DAMAGED, AUDIT_CORRECTION

  @IsNumber()
  @Min(1, { message: 'Quantity level must be at least 1.' })
  @Type(() => Number)
  @Min(1)
  quantity!: number; // The amount being changed
}
