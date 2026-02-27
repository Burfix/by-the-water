import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@ApiTags('Dashboard')
@ApiBearerAuth('JWT-auth')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('metrics')
  @Roles(Role.OPS_MANAGER, Role.EXEC)
  @ApiOperation({ summary: 'Get global dashboard KPIs and metrics' })
  getMetrics() {
    return this.dashboardService.getMetrics();
  }

  @Get('precinct-summary')
  @Roles(Role.OPS_MANAGER, Role.EXEC)
  @ApiOperation({ summary: 'Get compliance summary grouped by precinct' })
  getPrecinctSummary() {
    return this.dashboardService.getPrecinctSummary();
  }
}
