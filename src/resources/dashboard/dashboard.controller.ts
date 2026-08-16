import { Controller, Get, Post } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { UserRole } from '../../auth/entities/role.entity';
import { Roles } from '../../decorators/roles.decorator';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Post('inventory-health')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
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
