import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/roles';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { RequiresFeature, SubscriptionGuard } from '../../subscriptions/subscription.guard';
import { PermissionGuard, RequiresPermissions } from '../../permissions/permission.guard';
import { ProfitabilityQueryDto, ProfitabilityReportResponseDto } from './dto/profitability.dto';
import { ProfitabilityService } from './profitability.service';

@ApiTags('profitability')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, SubscriptionGuard, PermissionGuard)
@RequiresFeature('profitability')
@Controller('profitability')
export class ProfitabilityController {
  constructor(private readonly profitability: ProfitabilityService) {}

  @Get()
  @RequiresPermissions('profitability.view')
  @ApiOperation({ summary: 'Consultar ingresos, costos, gastos y utilidad por periodo' })
  @ApiOkResponse({ type: ProfitabilityReportResponseDto })
  report(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ProfitabilityQueryDto,
  ): Promise<ProfitabilityReportResponseDto> {
    return this.profitability.report(user, query);
  }
}
