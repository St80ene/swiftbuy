import {
  Entity,
  BaseEntity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { IsEnum } from 'class-validator';

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

export enum StockMovementAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  CANCEL = 'CANCEL',
  IN = 'IN',
}

@Entity('stock_movements')
export class StockMovement extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 36 })
  business_id!: string;

  @Column({ type: 'varchar', length: 36 })
  store_id!: string;

  @Column({ type: 'varchar', length: 36 })
  stock_id!: string;

  @Column({ type: 'varchar', length: 36 })
  product_id!: string;

  @Column({ type: 'varchar', length: 36, nullable: true })
  created_by_id!: string | null;

  @IsEnum(StockMovementType, {
    message:
      'Invalid stock movement type. Must be one of: RECEIPT, SALE, ADJUSTMENT, TRANSFER_IN, TRANSFER_OUT, RETURN_IN, RETURN_OUT, DAMAGE, LOSS, REVERSAL.',
  })
  @Column({
    type: 'varchar',
    length: '30',
    default: StockMovementType.RECEIPT,
  })
  type!: StockMovementType;

  @IsEnum(StockMovementAction, {
    message:
      'Invalid stock movement action. Must be one of: CREATE, UPDATE, DELETE, APPROVE, REJECT, CANCEL.',
  })
  @Column({
    type: 'varchar',
    length: '30',
    default: StockMovementAction.CREATE,
  })
  action!: StockMovementAction;

  @Column({ type: 'int' })
  quantity!: number;

  @Column({ type: 'int' })
  quantity_before!: number;

  @Column({ type: 'int' })
  quantity_after!: number;

  @Column('decimal', {
    precision: 12,
    scale: 2,
  })
  unit_cost_price!: number;

  @Column('decimal', {
    precision: 12,
    scale: 2,
    nullable: true,
  })
  unit_selling_price!: number | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  reason!: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  reference_type!: string | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  reference_id!: string | null;

  @CreateDateColumn({
    type: 'datetime',
  })
  created_at!: Date;
}
