import { Controller, Get, Post } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Post('inventory-health')
  getInventoryHealth() {
    return this.dashboardService.getInventoryHealth();
  }

  @Get('procurement-pipeline')
  getProcurementPipeline() {
    return this.dashboardService.getProcurementPipeline();
  }

  @Get('warehouse-operations')
  getWarehouseOperations() {
    return this.dashboardService.getWarehouseOperations();
  }
}
