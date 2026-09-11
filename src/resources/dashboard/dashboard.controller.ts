import { Controller, Get, Post } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { UserRole } from '../../common/enum/user_role.enum';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Post('inventory-health')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  getInventoryHealth(@CurrentUser() user: AuthenticatedUser) {
    return this.dashboardService.getInventoryHealth(user);
  }

  @Get('procurement-pipeline')
  getProcurementPipeline() {
    return this.dashboardService.getProcurementPipeline();
  }

  @Get('warehouse-operations')
  getWarehouseOperations(@CurrentUser() user: AuthenticatedUser) {
    return this.dashboardService.getWarehouseOperations(user);
  }
}
