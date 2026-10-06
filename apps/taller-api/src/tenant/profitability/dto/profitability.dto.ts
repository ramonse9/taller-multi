import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsIn, IsInt, IsOptional, Matches } from 'class-validator';

export class ProfitabilityQueryDto {
  @ApiPropertyOptional({ format: 'date', description: 'Por defecto, primer día del mes actual' })
  @IsOptional()
  @IsDateString({ strict: true })
  occurredFrom?: string;

  @ApiPropertyOptional({ format: 'date', description: 'Por defecto, fecha actual' })
  @IsOptional()
  @IsDateString({ strict: true })
  occurredTo?: string;
}

export class ProfitabilityTotalsResponseDto {
  @ApiProperty() completedOrderCount!: number;
  @ApiProperty() incompleteOrderCount!: number;
  @ApiProperty({ description: 'Órdenes terminadas con conceptos cobrables sin precio' })
  missingPriceOrderCount!: number;
  @ApiProperty({ description: 'Órdenes terminadas con productos libres sin costo conocido' })
  missingCostOrderCount!: number;
  @ApiProperty() paidCompletedOrderCount!: number;
  @ApiProperty() unpaidCompletedOrderCount!: number;
  @ApiProperty({ description: 'Órdenes no canceladas pendientes de pago a la fecha de corte' })
  receivableOrderCount!: number;
  @ApiProperty({ description: 'Ingresos de órdenes terminadas con importe definido' })
  income!: string;
  @ApiProperty() collectedIncome!: string;
  @ApiProperty() outstandingIncome!: string;
  @ApiProperty({ description: 'Importe de órdenes no canceladas pendientes de pago' })
  receivableAmount!: string;
  @ApiProperty({ description: 'Costos directos históricos de las órdenes terminadas' })
  directCost!: string;
  @ApiProperty({ description: 'Parte del costo directo proveniente de consumos FIFO' })
  fifoProductCost!: string;
  @ApiProperty() grossProfit!: string;
  @ApiProperty() collectedGrossProfit!: string;
  @ApiProperty() operatingExpenses!: string;
  @ApiProperty() netProfit!: string;
  @ApiProperty({ description: 'Utilidad bruta cobrada menos gastos confirmados' })
  collectedNetResult!: string;
  @ApiProperty({ nullable: true, type: String }) grossMarginPercent!: string | null;
  @ApiProperty({ nullable: true, type: String }) netMarginPercent!: string | null;
  @ApiProperty() isComplete!: boolean;
}

export class ProfitabilityPeriodRowResponseDto {
  @ApiProperty() period!: string;
  @ApiProperty() completedOrderCount!: number;
  @ApiProperty() income!: string;
  @ApiProperty() collectedIncome!: string;
  @ApiProperty() outstandingIncome!: string;
  @ApiProperty() directCost!: string;
  @ApiProperty() grossProfit!: string;
  @ApiProperty() operatingExpenses!: string;
  @ApiProperty() netProfit!: string;
  @ApiProperty() collectedNetResult!: string;
}

export class ProfitabilityCustomerRowResponseDto {
  @ApiProperty({ format: 'uuid' }) customerId!: string;
  @ApiProperty() customerName!: string;
  @ApiProperty({ enum: ['person', 'company'] }) customerType!: 'person' | 'company';
  @ApiProperty() completedOrderCount!: number;
  @ApiProperty() income!: string;
  @ApiProperty() collectedIncome!: string;
  @ApiProperty() outstandingIncome!: string;
  @ApiProperty() directCost!: string;
  @ApiProperty() grossProfit!: string;
}

export class ProfitabilityServiceTypeRowResponseDto {
  @ApiProperty({ enum: ['service', 'product'] })
  type!: 'service' | 'product';
  @ApiProperty() name!: string;
  @ApiProperty() itemCount!: number;
  @ApiProperty() income!: string;
  @ApiProperty() directCost!: string;
  @ApiProperty() grossProfit!: string;
}

export class ProfitabilityOrderRowResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() folio!: string;
  @ApiProperty({ format: 'uuid' }) customerId!: string;
  @ApiProperty() customerName!: string;
  @ApiProperty() completedAt!: Date;
  @ApiProperty({ nullable: true, type: String }) income!: string | null;
  @ApiProperty({ nullable: true, type: String }) directCost!: string | null;
  @ApiProperty() fifoProductCost!: string;
  @ApiProperty({ nullable: true, type: String }) grossProfit!: string | null;
  @ApiProperty() hasMissingPrice!: boolean;
  @ApiProperty() hasUnknownProductCost!: boolean;
  @ApiProperty() isComplete!: boolean;
  @ApiProperty() isPaid!: boolean;
}

export class ProfitabilityReportResponseDto {
  @ApiProperty({ format: 'date' }) occurredFrom!: string;
  @ApiProperty({ format: 'date' }) occurredTo!: string;
  @ApiProperty({ type: ProfitabilityTotalsResponseDto }) totals!: ProfitabilityTotalsResponseDto;
  @ApiProperty({ type: ProfitabilityPeriodRowResponseDto, isArray: true })
  byDay!: ProfitabilityPeriodRowResponseDto[];
  @ApiProperty({ type: ProfitabilityPeriodRowResponseDto, isArray: true })
  byMonth!: ProfitabilityPeriodRowResponseDto[];
  @ApiProperty({ type: ProfitabilityCustomerRowResponseDto, isArray: true })
  byCustomer!: ProfitabilityCustomerRowResponseDto[];
  @ApiProperty({ type: ProfitabilityServiceTypeRowResponseDto, isArray: true })
  byServiceType!: ProfitabilityServiceTypeRowResponseDto[];
  @ApiProperty({ type: ProfitabilityOrderRowResponseDto, isArray: true })
  orders!: ProfitabilityOrderRowResponseDto[];
}

export class ProfitabilityAnalyticsQueryDto {
  @ApiPropertyOptional({ default: 6, enum: [6, 12] })
  @Type(() => Number)
  @IsInt()
  @IsIn([6, 12])
  months = 6;

  @ApiPropertyOptional({
    example: '2026-10',
    description: 'Mes final del análisis; por defecto se utiliza el mes actual',
  })
  @IsOptional()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/)
  endingMonth?: string;
}

export class ProfitabilityAnalyticsMonthResponseDto {
  @ApiProperty({ example: '2026-10' }) period!: string;
  @ApiProperty({ format: 'date' }) startsOn!: string;
  @ApiProperty({ format: 'date' }) endsOn!: string;
  @ApiProperty() completedOrderCount!: number;
  @ApiProperty() incompleteOrderCount!: number;
  @ApiProperty({ description: 'Ingreso de órdenes terminadas en el mes' })
  generatedIncome!: string;
  @ApiProperty({ description: 'Costo directo de órdenes terminadas en el mes' })
  generatedDirectCost!: string;
  @ApiProperty() generatedGrossProfit!: string;
  @ApiProperty() operatingExpenses!: string;
  @ApiProperty({ description: 'Utilidad generada menos gastos confirmados del mes' })
  generatedNetProfit!: string;
  @ApiProperty({ nullable: true, type: String }) generatedNetMarginPercent!: string | null;
  @ApiProperty({ description: 'Órdenes cuyo cobro se registró durante el mes' })
  collectedOrderCount!: number;
  @ApiProperty({ description: 'Importe de órdenes cuyo cobro se registró durante el mes' })
  collectedIncome!: string;
  @ApiProperty() collectedDirectCost!: string;
  @ApiProperty() collectedGrossProfit!: string;
  @ApiProperty({ description: 'Utilidad bruta cobrada menos gastos confirmados del mes' })
  collectedNetResult!: string;
  @ApiProperty() isComplete!: boolean;
}

export class ProfitabilityCollectionBreakdownResponseDto {
  @ApiProperty({ description: 'Órdenes terminadas en el mes que actualmente están pagadas' })
  paidOrderCount!: number;
  @ApiProperty() paidAmount!: string;
  @ApiProperty({ description: 'Órdenes terminadas en el mes que continúan pendientes' })
  pendingOrderCount!: number;
  @ApiProperty() pendingAmount!: string;
}

export class ProfitabilityExpenseCategoryResponseDto {
  @ApiProperty({ format: 'uuid' }) categoryId!: string;
  @ApiProperty() categoryCode!: string;
  @ApiProperty() categoryName!: string;
  @ApiProperty() expenseCount!: number;
  @ApiProperty() amount!: string;
  @ApiProperty({ nullable: true, type: String }) percentage!: string | null;
}

export class ProfitabilityAnalyticsResponseDto {
  @ApiProperty({ enum: [6, 12] }) months!: number;
  @ApiProperty({ format: 'date' }) occurredFrom!: string;
  @ApiProperty({ format: 'date' }) occurredTo!: string;
  @ApiProperty({ type: ProfitabilityAnalyticsMonthResponseDto })
  summary!: ProfitabilityAnalyticsMonthResponseDto;
  @ApiProperty({ type: ProfitabilityAnalyticsMonthResponseDto, isArray: true })
  series!: ProfitabilityAnalyticsMonthResponseDto[];
  @ApiProperty({ type: ProfitabilityCollectionBreakdownResponseDto })
  collection!: ProfitabilityCollectionBreakdownResponseDto;
  @ApiProperty({ type: ProfitabilityExpenseCategoryResponseDto, isArray: true })
  expensesByCategory!: ProfitabilityExpenseCategoryResponseDto[];
}
