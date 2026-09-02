import { Controller, Get, Post } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { Roles } from '../../decorators/roles.decorator';
import { UserRole } from '../../common/enum/user_role.enum';

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
