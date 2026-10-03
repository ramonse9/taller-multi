import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/roles';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { RequiresSubscription, SubscriptionGuard } from '../../subscriptions/subscription.guard';
import { DashboardService } from './dashboard.service';
import { DashboardActivityResponseDto, DashboardSummaryResponseDto } from './dto/dashboard.dto';

@ApiTags('dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, SubscriptionGuard)
@RequiresSubscription()
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Consultar el resumen operativo del taller para el plan actual' })
  @ApiOkResponse({ type: DashboardSummaryResponseDto })
  summary(@CurrentUser() user: AuthenticatedUser): Promise<DashboardSummaryResponseDto> {
    return this.dashboard.summary(user);
  }

  @Get('activity')
  @ApiOperation({ summary: 'Consultar actividad reciente y alertas operativas del taller' })
  @ApiOkResponse({ type: DashboardActivityResponseDto })
  activity(@CurrentUser() user: AuthenticatedUser): Promise<DashboardActivityResponseDto> {
    return this.dashboard.activity(user);
  }
}
