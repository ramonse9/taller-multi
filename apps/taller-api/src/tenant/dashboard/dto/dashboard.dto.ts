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
  @ApiProperty({ description: 'Órdenes no canceladas que continúan pendientes de cobro' })
  unpaidCount!: number;
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
  @ApiProperty({ description: 'Importe actual de órdenes no canceladas pendientes de cobro' })
  receivable!: string;
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

export class DashboardOrderActivityResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() folio!: string;
  @ApiProperty({ format: 'uuid' }) customerId!: string;
  @ApiProperty() customerName!: string;
  @ApiProperty({ format: 'uuid' }) vehicleId!: string;
  @ApiProperty() brandName!: string;
  @ApiProperty() modelName!: string;
  @ApiProperty({ enum: ['in_progress', 'completed', 'cancelled'] }) status!: string;
  @ApiProperty() isPaid!: boolean;
  @ApiProperty({ nullable: true, type: String }) total!: string | null;
  @ApiProperty() updatedAt!: Date;
}

export class DashboardOldOrderResponseDto extends DashboardOrderActivityResponseDto {
  @ApiProperty() openedAt!: Date;
  @ApiProperty() daysOpen!: number;
}

export class DashboardReceivableResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() folio!: string;
  @ApiProperty({ format: 'uuid' }) customerId!: string;
  @ApiProperty() customerName!: string;
  @ApiProperty({ format: 'uuid' }) vehicleId!: string;
  @ApiProperty() brandName!: string;
  @ApiProperty() modelName!: string;
  @ApiProperty({ enum: ['in_progress', 'completed'] }) status!: string;
  @ApiProperty({ nullable: true, type: String }) total!: string | null;
  @ApiProperty() openedAt!: Date;
  @ApiProperty({ nullable: true, type: Date }) completedAt!: Date | null;
}

export class DashboardPurchaseActivityResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() folio!: string;
  @ApiProperty({ format: 'uuid' }) supplierId!: string;
  @ApiProperty() supplierName!: string;
  @ApiProperty({ enum: ['draft', 'confirmed', 'cancelled'] }) status!: string;
  @ApiProperty() total!: string;
  @ApiProperty() itemCount!: number;
  @ApiProperty() purchasedAt!: Date;
  @ApiProperty() updatedAt!: Date;
}

export class DashboardExpenseActivityResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() description!: string;
  @ApiProperty() categoryName!: string;
  @ApiProperty() supplierName!: string;
  @ApiProperty({ enum: ['draft', 'confirmed', 'cancelled'] }) status!: string;
  @ApiProperty() amount!: string;
  @ApiProperty({ format: 'date' }) occurredOn!: string;
  @ApiProperty() updatedAt!: Date;
}

export class DashboardInventoryMovementActivityResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) productId!: string;
  @ApiProperty() productName!: string;
  @ApiProperty({ nullable: true, type: String }) productSku!: string | null;
  @ApiProperty({ enum: ['entry', 'exit', 'adjustment'] }) type!: string;
  @ApiProperty() quantity!: string;
  @ApiProperty() resultingStock!: string;
  @ApiProperty() reason!: string;
  @ApiProperty() createdAt!: Date;
}

export class DashboardActivityResponseDto {
  @ApiProperty({ type: DashboardOrderActivityResponseDto, isArray: true })
  recentOrders!: DashboardOrderActivityResponseDto[];
  @ApiProperty({ type: DashboardOldOrderResponseDto, isArray: true })
  oldestInProgress!: DashboardOldOrderResponseDto[];
  @ApiProperty({ type: DashboardReceivableResponseDto, isArray: true })
  pendingCollection!: DashboardReceivableResponseDto[];
  @ApiProperty({ type: DashboardPurchaseActivityResponseDto, isArray: true, nullable: true })
  recentPurchases!: DashboardPurchaseActivityResponseDto[] | null;
  @ApiProperty({ type: DashboardExpenseActivityResponseDto, isArray: true, nullable: true })
  recentExpenses!: DashboardExpenseActivityResponseDto[] | null;
  @ApiProperty({
    type: DashboardInventoryMovementActivityResponseDto,
    isArray: true,
    nullable: true,
  })
  recentInventoryMovements!: DashboardInventoryMovementActivityResponseDto[] | null;
  @ApiProperty({ type: DashboardLowStockResponseDto, nullable: true })
  lowStock!: DashboardLowStockResponseDto | null;
}
