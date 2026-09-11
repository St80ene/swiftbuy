export class CreateStockDto {
  product_id!: string;
  type!: MutationType; // 'INFLOW' or 'OUTFLOW'
  reason!: MutationReason; // 'SUPPLIER_RESTOCK', 'STOLEN', 'DAMAGED', etc.
  quantity!: number;
  unit_selling_price!: number;
  unit_cost_price!: number;
}

export enum MutationType {
  INFLOW = 'INFLOW',
  OUTFLOW = 'OUTFLOW',
}

export enum MutationReason {
  SUPPLIER_RESTOCK = 'SUPPLIER_RESTOCK',
  CUSTOMER_RETURN = 'CUSTOMER_RETURN',
  DAMAGED = 'DAMAGED',
  STOLEN = 'STOLEN',
  OTHER = 'OTHER',
  NEW_PRODUCT_INITIALIZATION = 'NEW_PRODUCT_INITIALIZATION',
}
