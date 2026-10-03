import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

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
  @ApiProperty({ description: 'Ingresos de órdenes terminadas con importe definido' })
  income!: string;
  @ApiProperty({ description: 'Costos directos históricos de las órdenes terminadas' })
  directCost!: string;
  @ApiProperty({ description: 'Parte del costo directo proveniente de consumos FIFO' })
  fifoProductCost!: string;
  @ApiProperty() grossProfit!: string;
  @ApiProperty() operatingExpenses!: string;
  @ApiProperty() netProfit!: string;
  @ApiProperty({ nullable: true, type: String }) grossMarginPercent!: string | null;
  @ApiProperty({ nullable: true, type: String }) netMarginPercent!: string | null;
  @ApiProperty() isComplete!: boolean;
}

export class ProfitabilityPeriodRowResponseDto {
  @ApiProperty() period!: string;
  @ApiProperty() completedOrderCount!: number;
  @ApiProperty() income!: string;
  @ApiProperty() directCost!: string;
  @ApiProperty() grossProfit!: string;
  @ApiProperty() operatingExpenses!: string;
  @ApiProperty() netProfit!: string;
}

export class ProfitabilityCustomerRowResponseDto {
  @ApiProperty({ format: 'uuid' }) customerId!: string;
  @ApiProperty() customerName!: string;
  @ApiProperty({ enum: ['person', 'company'] }) customerType!: 'person' | 'company';
  @ApiProperty() completedOrderCount!: number;
  @ApiProperty() income!: string;
  @ApiProperty() directCost!: string;
  @ApiProperty() grossProfit!: string;
}

export class ProfitabilityServiceTypeRowResponseDto {
  @ApiProperty({ enum: ['service', 'product', 'free'] })
  type!: 'service' | 'product' | 'free';
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
  @ApiProperty() isComplete!: boolean;
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
