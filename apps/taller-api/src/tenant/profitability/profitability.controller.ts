import { Controller, Get, Query, Res, StreamableFile, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiProduces, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../../auth/roles';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import {
  RequiresFeature,
  RequiresFeatureReadAccess,
  SubscriptionGuard,
} from '../../subscriptions/subscription.guard';
import { PermissionGuard, RequiresPermissions } from '../../permissions/permission.guard';
import {
  MonthlyProfitabilityReportQueryDto,
  MonthlyProfitabilityReportResponseDto,
  ProfitabilityAnalyticsQueryDto,
  ProfitabilityAnalyticsResponseDto,
  ProfitabilityQueryDto,
  ProfitabilityReportResponseDto,
} from './dto/profitability.dto';
import { ProfitabilityService } from './profitability.service';
import { ProfitabilityWorkbookService } from './profitability-workbook.service';
import { BillingReconciliationQueryService } from '../invoicing/billing-reconciliation-query.service';
import {
  BillingReconciliationPeriodQueryDto,
  ProfitabilityBillingReconciliationResponseDto,
} from '../invoicing/dto/billing-reconciliation.dto';

@ApiTags('profitability')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, SubscriptionGuard, PermissionGuard)
@RequiresFeature('profitability')
@Controller('profitability')
export class ProfitabilityController {
  constructor(
    private readonly profitability: ProfitabilityService,
    private readonly workbook: ProfitabilityWorkbookService,
    private readonly billingReconciliation: BillingReconciliationQueryService,
  ) {}

  @Get('billing-reconciliation')
  @RequiresFeatureReadAccess('invoicing')
  @RequiresPermissions('profitability.view', 'invoices.view')
  @ApiOperation({
    summary: 'Conciliar utilidad operativa con facturación simulada por periodo',
    description:
      'Separa importes operativos de totales documentales simulados; facturar no modifica la utilidad.',
  })
  @ApiOkResponse({ type: ProfitabilityBillingReconciliationResponseDto })
  billingSummary(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: BillingReconciliationPeriodQueryDto,
  ): Promise<ProfitabilityBillingReconciliationResponseDto> {
    return this.billingReconciliation.profitability(user, query);
  }

  @Get('monthly-report.xlsx')
  @RequiresPermissions('profitability.view')
  @ApiOperation({ summary: 'Descargar órdenes y utilidad de un mes en formato XLSX' })
  @ApiProduces('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  @ApiOkResponse({
    description: 'Archivo XLSX con resumen mensual y una fila por orden',
    content: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
        schema: { type: 'string', format: 'binary' },
      },
    },
  })
  async monthlyReportWorkbook(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: MonthlyProfitabilityReportQueryDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    const report = await this.profitability.monthlyReport(user, query);
    const file = await this.workbook.build(report, user.companyName ?? 'Taller');
    response.setHeader('Content-Type', file.contentType);
    response.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
    response.setHeader('Cache-Control', 'private, no-store');
    return new StreamableFile(file.buffer);
  }

  @Get('monthly-report')
  @RequiresPermissions('profitability.view')
  @ApiOperation({ summary: 'Consultar órdenes y utilidad de un mes para exportación' })
  @ApiOkResponse({ type: MonthlyProfitabilityReportResponseDto })
  monthlyReport(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: MonthlyProfitabilityReportQueryDto,
  ): Promise<MonthlyProfitabilityReportResponseDto> {
    return this.profitability.monthlyReport(user, query);
  }

  @Get('analytics')
  @RequiresPermissions('profitability.view')
  @ApiOperation({ summary: 'Consultar resumen mensual y serie histórica de utilidad' })
  @ApiOkResponse({ type: ProfitabilityAnalyticsResponseDto })
  analytics(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ProfitabilityAnalyticsQueryDto,
  ): Promise<ProfitabilityAnalyticsResponseDto> {
    return this.profitability.analytics(user, query);
  }

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
