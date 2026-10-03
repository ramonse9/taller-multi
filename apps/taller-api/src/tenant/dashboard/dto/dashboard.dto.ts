import { ApiProperty } from '@nestjs/swagger';
import { SubscriptionPlanCode } from '../../../subscriptions/subscription.types';

export class DashboardPeriodResponseDto {
  @ApiProperty({ example: '2026-10' }) month!: string;
  @ApiProperty({ format: 'date' }) startsOn!: string;
  @ApiProperty({ format: 'date' }) endsOn!: string;
}

export class DashboardAccessResponseDto {
  @ApiProperty({ enum: ['basic', 'control', 'invoicing'] })
  planCode!: SubscriptionPlanCode;
  @ApiProperty() planName!: string;
  @ApiProperty() includesFinancials!: boolean;
  @ApiProperty() includesLowStock!: boolean;
}

export class DashboardOrdersResponseDto {
  @ApiProperty({ description: 'Órdenes que actualmente están en proceso' })
  inProgressCount!: number;
  @ApiProperty({ description: 'Órdenes terminadas que continúan pendientes de cobro' })
  completedUnpaidCount!: number;
  @ApiProperty({ description: 'Órdenes terminadas que actualmente están pagadas' })
  completedPaidCount!: number;
}

export class DashboardRevenueResponseDto {
  @ApiProperty({ description: 'Ingreso generado por órdenes terminadas durante el mes' })
  generated!: string;
  @ApiProperty({ description: 'Ingreso de órdenes del mes actualmente marcadas como pagadas' })
  collected!: string;
  @ApiProperty({ description: 'Ingreso de órdenes del mes todavía pendientes de cobro' })
  outstanding!: string;
}

export class DashboardFinancialsResponseDto {
  @ApiProperty() directCost!: string;
  @ApiProperty() grossProfit!: string;
  @ApiProperty() operatingExpenses!: string;
  @ApiProperty({ description: 'Utilidad bruta generada menos gastos confirmados del mes' })
  operatingProfit!: string;
  @ApiProperty() incompleteOrderCount!: number;
  @ApiProperty({ description: 'Indica si todas las órdenes terminadas tienen precio y costo' })
  isComplete!: boolean;
}

export class DashboardLowStockProductResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ nullable: true, type: String }) sku!: string | null;
  @ApiProperty() name!: string;
  @ApiProperty() unitSymbol!: string;
  @ApiProperty({ description: 'Existencia actual entregada como texto' }) stock!: string;
  @ApiProperty({ description: 'Existencia mínima entregada como texto' }) minimumStock!: string;
}

export class DashboardLowStockResponseDto {
  @ApiProperty() totalProducts!: number;
  @ApiProperty({ type: DashboardLowStockProductResponseDto, isArray: true })
  products!: DashboardLowStockProductResponseDto[];
}

export class DashboardSummaryResponseDto {
  @ApiProperty({ type: DashboardPeriodResponseDto }) period!: DashboardPeriodResponseDto;
  @ApiProperty({ type: DashboardAccessResponseDto }) access!: DashboardAccessResponseDto;
  @ApiProperty({ type: DashboardOrdersResponseDto }) orders!: DashboardOrdersResponseDto;
  @ApiProperty({ type: DashboardRevenueResponseDto }) revenue!: DashboardRevenueResponseDto;
  @ApiProperty({ type: DashboardFinancialsResponseDto, nullable: true })
  financials!: DashboardFinancialsResponseDto | null;
  @ApiProperty({ type: DashboardLowStockResponseDto, nullable: true })
  lowStock!: DashboardLowStockResponseDto | null;
}
