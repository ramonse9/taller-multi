import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

export class BillingReconciliationPeriodQueryDto {
  @ApiPropertyOptional({
    format: 'date',
    description: 'Primer día local incluido. Por defecto, el primer día del mes actual.',
  })
  @IsOptional()
  @IsDateString({ strict: true })
  occurredFrom?: string;

  @ApiPropertyOptional({
    format: 'date',
    description: 'Último día local incluido. Por defecto, el último día del mes actual.',
  })
  @IsOptional()
  @IsDateString({ strict: true })
  occurredTo?: string;
}

export class BillingReconciliationPeriodResponseDto {
  @ApiProperty({ format: 'date-time', description: 'Inicio incluido convertido a UTC.' })
  startsAt!: string;

  @ApiProperty({
    format: 'date-time',
    description: 'Fin exclusivo convertido a UTC. Los indicadores usan el rango [inicio, fin).',
  })
  endsBefore!: string;
}

export class DashboardBillingReconciliationResponseDto {
  @ApiProperty() pendingToInvoiceCount!: number;
  @ApiProperty({ description: 'Importe operativo; no es el total fiscal simulado.' })
  pendingToInvoiceOperationalAmount!: string;
  @ApiProperty() activeDraftCount!: number;
  @ApiProperty() issuedThisPeriodCount!: number;
  @ApiProperty({ description: 'Total documental simulado, separado del ingreso de las órdenes.' })
  issuedThisPeriodSimulatedTotal!: string;
  @ApiProperty() ppdPendingCollectionCount!: number;
}

export class ProfitabilityBillingReconciliationResponseDto {
  @ApiProperty({ type: BillingReconciliationPeriodResponseDto })
  period!: BillingReconciliationPeriodResponseDto;
  @ApiProperty() completedOrderCount!: number;
  @ApiProperty() generatedOperationalAmount!: string;
  @ApiProperty() issuedOrderCount!: number;
  @ApiProperty({ description: 'Importe operativo de las órdenes con simulación activa emitida.' })
  issuedOrderOperationalAmount!: string;
  @ApiProperty() pendingToInvoiceCount!: number;
  @ApiProperty() pendingToInvoiceOperationalAmount!: string;
  @ApiProperty() collectedOperationalAmount!: string;
  @ApiProperty() pendingCollectionOperationalAmount!: string;
  @ApiProperty({ description: 'Subtotal documental simulado; no modifica la utilidad.' })
  issuedSimulationSubtotal!: string;
  @ApiProperty({ description: 'Impuestos documentales simulados; no modifican la utilidad.' })
  issuedSimulationTax!: string;
  @ApiProperty({ description: 'Total documental simulado; no se suma a los ingresos.' })
  issuedSimulationTotal!: string;
  @ApiProperty() incompleteCostOrderCount!: number;
}

export class InvoiceBillingReconciliationResponseDto {
  @ApiProperty({ type: BillingReconciliationPeriodResponseDto })
  period!: BillingReconciliationPeriodResponseDto;
  @ApiProperty() pendingToInvoiceCount!: number;
  @ApiProperty() pendingToInvoiceOperationalAmount!: string;
  @ApiProperty() activeDraftCount!: number;
  @ApiProperty() activeDraftOperationalAmount!: string;
  @ApiProperty() issuedSimulationCount!: number;
  @ApiProperty() issuedSimulationSubtotal!: string;
  @ApiProperty() issuedSimulationTax!: string;
  @ApiProperty() issuedSimulationTotal!: string;
  @ApiProperty() cancelledSimulationCount!: number;
  @ApiProperty() cancelledSimulatedTotal!: string;
  @ApiProperty() ppdPendingCollectionCount!: number;
  @ApiProperty() ppdPendingCollectionOperationalAmount!: string;
  @ApiProperty() ppdPendingCollectionSimulatedTotal!: string;
}
