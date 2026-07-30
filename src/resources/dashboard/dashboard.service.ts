import { Injectable } from '@nestjs/common';
import { ProductsService } from '../products/products.service';
import { PurchaseOrdersService } from '../purchase_orders/purchase_orders.service';
import { StocksService } from '../stocks/stock.service';

@Injectable()
export class DashboardService {
  constructor(
    private readonly productsService: ProductsService,
    private readonly purchaseOrdersService: PurchaseOrdersService,
    private readonly stocksService: StocksService,
  ) {}

  async getDashboard() {
    const [inventory, procurement, warehouse] = await Promise.all([
      this.getInventoryHealth(),
      this.getProcurementPipeline(),
      this.getWarehouseOperations(),
    ]);

    return {
      inventory,
      procurement,
      warehouse,
    };
  }

  async getInventoryHealth(): Promise<DashboardSection> {
    return {
      title: 'Inventory Health',
      cards: await this.productsService.getInventoryHealth(),
    };
  }

  async getProcurementPipeline(): Promise<DashboardSection> {
    return {
      title: 'Procurement Pipeline',
      cards: await this.purchaseOrdersService.getPurchaseOrderPipeline(),
    };
  }

  async getWarehouseOperations(): Promise<DashboardSection> {
    return {
      title: 'Warehouse Operations',
      cards: await this.stocksService.getWarehouseMetrics(),
    };
  }
}

export interface DashboardSection {
  title: string;
  cards: DashboardCard[];
}

export interface DashboardCard {
  id: string;

  title: string;

  value: number | string;

  subtitle?: string;

  severity?: 'success' | 'warning' | 'danger' | 'info';

  icon?: string;

  action?: DashboardAction;
}

export interface DashboardAction {
  label: string;
  url: string;
}
