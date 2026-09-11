import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Business } from '../../business/entities/business.entity';
import { Stock } from '../../stocks/entities/stock.entity';
import { User } from '../../users/entities/user.entity';

export enum StockMovementType {
  RECEIPT = 'RECEIPT',
  SALE = 'SALE',
  ADJUSTMENT = 'ADJUSTMENT',
  TRANSFER_IN = 'TRANSFER_IN',
  TRANSFER_OUT = 'TRANSFER_OUT',
  RETURN_IN = 'RETURN_IN',
  RETURN_OUT = 'RETURN_OUT',
  DAMAGE = 'DAMAGE',
  LOSS = 'LOSS',
  REVERSAL = 'REVERSAL',
}

export enum StockMovementDirection {
  IN = 'IN',
  OUT = 'OUT',
}

export enum StockMovementReferenceType {
  PURCHASE_ORDER = 'PURCHASE_ORDER',
  STOCK_ADJUSTMENT = 'STOCK_ADJUSTMENT',
  STOCK_TRANSFER = 'STOCK_TRANSFER',
  SALE = 'SALE',
  STOCK_MOVEMENT = 'STOCK_MOVEMENT',
}

@Entity('stock_movements')
export class StockMovement extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 36 })
  stock_id!: string;

  /**
   * Snapshot of the business tenant.
   *
   * Keeping this on the immutable ledger makes tenant-level
   * reporting and integrity checks easier.
   */
  @Column({ type: 'varchar', length: 36 })
  business_id!: string;

  @Column({ type: 'varchar', length: 36 })
  created_by_id!: string | null;

  @Column({
    type: 'varchar',
    length: 30,
  })
  type!: StockMovementType;

  /**
   * Explicit direction is necessary because ADJUSTMENT
   * can either increase or decrease stock.
   */
  @Column({
    type: 'varchar',
    length: 10,
  })
  direction!: StockMovementDirection;

  /**
   * Always store a positive quantity.
   *
   * Direction determines whether it is added or removed.
   */
  @Column({ type: 'int' })
  quantity!: number;

  /**
   * Stock balance before this movement.
   */
  @Column({ type: 'int' })
  quantity_before!: number;

  /**
   * Stock balance after this movement.
   */
  @Column({ type: 'int' })
  quantity_after!: number;

  /**
   * Historical cost snapshot at the time of the movement.
   */
  @Column('decimal', {
    precision: 12,
    scale: 2,
  })
  unit_cost_price!: number;

  /**
   * Historical selling price snapshot.
   *
   * This is useful for sales/reporting but may be null
   * for movements where selling price is irrelevant.
   */
  @Column('decimal', {
    precision: 12,
    scale: 2,
    nullable: true,
  })
  unit_selling_price!: number | null;

  /**
   * Human-readable explanation.
   *
   * Example:
   * "Damaged during stock count"
   */
  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  reason!: string | null;

  /**
   * Optional link to the business object that caused the movement.
   */
  @Column({
    type: 'varchar',
    length: 30,
    nullable: true,
  })
  reference_type!: StockMovementReferenceType | null;

  @Column({
    type: 'varchar',
    length: 36,
    nullable: true,
  })
  reference_id!: string | null;

  @ManyToOne(() => Stock, (stock) => stock.movements, {
    nullable: false,
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'stock_id' })
  stock!: Stock;

  @ManyToOne(() => Business, {
    nullable: false,
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'business_id' })
  business!: Business;

  @ManyToOne(() => User, {
    nullable: true,
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'created_by_id' })
  created_by!: User | null;

  @CreateDateColumn({
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
  })
  created_at!: Date;
}
