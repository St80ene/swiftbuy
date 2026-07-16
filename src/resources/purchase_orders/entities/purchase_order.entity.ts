import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { PurchaseOrderItem } from './purchase_order_item.entity';

export enum PurchaseOrderStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  RECEIVED = 'RECEIVED',
  CANCELLED = 'CANCELLED',
}

@Entity('purchase_orders')
export class PurchaseOrder {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  po_number!: string;

  @Column()
  supplier_id!: string;

  @Column({ type: 'varchar', length: 30, default: PurchaseOrderStatus.DRAFT })
  status!: PurchaseOrderStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0.0 })
  total_estimated_cost!: number;

  @Column()
  created_by_id!: string;

  @Column({ nullable: true })
  approved_by_id?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => PurchaseOrderItem, (item) => item.purchase_order, {
    cascade: true,
  })
  items!: PurchaseOrderItem[];
}
