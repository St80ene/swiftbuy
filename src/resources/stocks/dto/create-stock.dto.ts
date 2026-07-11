import { MutationType, MutationReason } from '../entities/stock.entity';

export class CreateStockDto {
  product_id!: string;
  type!: MutationType; // 'INFLOW' or 'OUTFLOW'
  reason!: MutationReason; // 'SUPPLIER_RESTOCK', 'STOLEN', 'DAMAGED', etc.
  quantity!: number;
  unit_selling_price!: number;
  unit_cost_price!: number;
}
