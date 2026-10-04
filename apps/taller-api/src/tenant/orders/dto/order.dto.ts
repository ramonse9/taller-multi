import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

const trimString = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

const nullablePrice = ({ value }: { value: unknown }): unknown =>
  value === '' || value === null ? null : value;

const booleanQuery = ({ value }: { value: unknown }): unknown => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
};

export enum OrderStatus {
  InProgress = 'in_progress',
  Completed = 'completed',
  Cancelled = 'cancelled',
}

export enum OrderItemKind {
  Product = 'product',
  Service = 'service',
}

export class OrderItemInputDto {
  @ApiPropertyOptional({ format: 'uuid', description: 'Renglón existente al editar una orden' })
  @IsOptional()
  @IsUUID('4')
  itemId?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Concepto del catálogo; ausente para captura libre',
  })
  @IsOptional()
  @IsUUID('4')
  productServiceId?: string | null;

  @ApiPropertyOptional({
    enum: OrderItemKind,
    default: OrderItemKind.Service,
    description: 'Tipo del concepto libre; los conceptos de catálogo copian su propio tipo',
  })
  @IsOptional()
  @IsEnum(OrderItemKind)
  kind?: OrderItemKind;

  @ApiProperty({ example: 'Cambio de balatas delanteras' })
  @ValidateIf(
    (input: OrderItemInputDto) => !input.productServiceId || input.description !== undefined,
  )
  @Transform(trimString)
  @IsString()
  @Length(1, 300)
  description?: string;

  @ApiProperty({ example: 1, minimum: 0.001, maximum: 999999999.999 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3, allowInfinity: false, allowNaN: false })
  @Min(0.001)
  @Max(999999999.999)
  quantity!: number;

  @ApiPropertyOptional({ example: 1200, nullable: true, minimum: 0 })
  @Transform(nullablePrice)
  @Type(() => Number)
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2, allowInfinity: false, allowNaN: false })
  @Min(0)
  @Max(999999999999.99)
  unitPrice?: number | null;

  @ApiPropertyOptional({ example: 800, nullable: true, minimum: 0 })
  @Transform(nullablePrice)
  @Type(() => Number)
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2, allowInfinity: false, allowNaN: false })
  @Min(0)
  @Max(999999999999.99)
  unitCost?: number | null;
}

export class CreateOrderDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  customerId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  vehicleId!: string;

  @ApiProperty({ type: OrderItemInputDto, isArray: true, minItems: 1, maxItems: 50 })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => OrderItemInputDto)
  items!: OrderItemInputDto[];
}

export class UpdateOrderDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  vehicleId?: string;

  @ApiPropertyOptional({ type: OrderItemInputDto, isArray: true, minItems: 1, maxItems: 50 })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => OrderItemInputDto)
  items?: OrderItemInputDto[];
}

export class ChangeOrderStatusDto {
  @ApiProperty({ enum: OrderStatus })
  @IsEnum(OrderStatus)
  status!: OrderStatus;
}

export class ChangeOrderPaymentStatusDto {
  @ApiProperty({ description: 'Indica si la orden está completamente pagada' })
  @IsBoolean()
  isPaid!: boolean;
}

export class CreateOrderNoteDto {
  @ApiProperty({ maxLength: 2000 })
  @Transform(trimString)
  @IsString()
  @Length(1, 2000)
  body!: string;
}

export class OrderQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;

  @ApiPropertyOptional({ default: '', maxLength: 100 })
  @IsOptional()
  @IsString()
  @Length(0, 100)
  search = '';

  @ApiPropertyOptional({ enum: OrderStatus })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  vehicleId?: string;

  @ApiPropertyOptional({ description: 'Filtrar órdenes pagadas o pendientes' })
  @Transform(booleanQuery)
  @IsOptional()
  @IsBoolean()
  isPaid?: boolean;
}

export class OrderItemCostLayerResponseDto {
  @ApiProperty({ format: 'uuid' }) lotId!: string;
  @ApiProperty({ description: 'Cantidad consumida entregada como texto' }) quantity!: string;
  @ApiProperty({ description: 'Costo unitario del lote entregado como texto' })
  unitCost!: string;
  @ApiProperty({ description: 'Costo consumido del lote entregado como texto' })
  costAmount!: string;
}

export class OrderItemResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid', nullable: true, type: String })
  productServiceId!: string | null;
  @ApiProperty({ enum: OrderItemKind }) kind!: OrderItemKind;
  @ApiProperty() position!: number;
  @ApiProperty() description!: string;
  @ApiProperty() unitName!: string;
  @ApiProperty() unitSymbol!: string;
  @ApiProperty({ description: 'Decimal entregado como texto' }) quantity!: string;
  @ApiProperty({ nullable: true, type: String }) unitPrice!: string | null;
  @ApiProperty({ nullable: true, type: String }) amount!: string | null;
  @ApiProperty({ nullable: true, type: String }) unitCost!: string | null;
  @ApiProperty({ nullable: true, type: String }) costAmount!: string | null;
  @ApiProperty() tracksInventory!: boolean;
  @ApiProperty({ type: OrderItemCostLayerResponseDto, isArray: true })
  costLayers!: OrderItemCostLayerResponseDto[];
}

export class OrderNoteResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() body!: string;
  @ApiProperty({ format: 'uuid' }) createdByUserId!: string;
  @ApiProperty() createdByName!: string;
  @ApiProperty() createdAt!: Date;
}

export class OrderStatusHistoryResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ enum: OrderStatus, nullable: true }) previousStatus!: OrderStatus | null;
  @ApiProperty({ enum: OrderStatus }) newStatus!: OrderStatus;
  @ApiProperty({ format: 'uuid' }) changedByUserId!: string;
  @ApiProperty() changedByName!: string;
  @ApiProperty() changedAt!: Date;
}

export class OrderCustomerResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ enum: ['person', 'company'] }) type!: 'person' | 'company';
  @ApiProperty() displayName!: string;
}

export class OrderVehicleResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() brandName!: string;
  @ApiProperty() modelName!: string;
  @ApiProperty() year!: number;
  @ApiProperty() color!: string;
  @ApiProperty({ nullable: true, type: String }) numeroSerie!: string | null;
  @ApiProperty({ nullable: true, type: String }) licensePlate!: string | null;
}

export class OrderSummaryResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ description: 'Folio automático por compañía; bigint entregado como texto' })
  folio!: string;
  @ApiProperty({ enum: OrderStatus }) status!: OrderStatus;
  @ApiProperty({ type: OrderCustomerResponseDto }) customer!: OrderCustomerResponseDto;
  @ApiProperty({ type: OrderVehicleResponseDto }) vehicle!: OrderVehicleResponseDto;
  @ApiProperty({ nullable: true, type: String }) subtotal!: string | null;
  @ApiProperty({ nullable: true, type: String }) total!: string | null;
  @ApiProperty({ nullable: true, type: String }) totalCost!: string | null;
  @ApiProperty({ nullable: true, type: String }) grossProfit!: string | null;
  @ApiProperty({ nullable: true, type: Date }) inventoryAppliedAt!: Date | null;
  @ApiProperty() hasUnpricedItems!: boolean;
  @ApiProperty() isPaid!: boolean;
  @ApiProperty() openedAt!: Date;
  @ApiProperty({ nullable: true, type: Date }) closedAt!: Date | null;
  @ApiProperty({ format: 'uuid' }) createdByUserId!: string;
  @ApiProperty({ format: 'uuid' }) updatedByUserId!: string;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}

export class OrderResponseDto extends OrderSummaryResponseDto {
  @ApiProperty({ type: OrderItemResponseDto, isArray: true }) items!: OrderItemResponseDto[];
  @ApiProperty({ type: OrderNoteResponseDto, isArray: true }) notes!: OrderNoteResponseDto[];
  @ApiProperty({ type: OrderStatusHistoryResponseDto, isArray: true })
  statusHistory!: OrderStatusHistoryResponseDto[];
}

export class OrderListItemResponseDto extends OrderSummaryResponseDto {
  @ApiProperty() itemCount!: number;
}

export class PaginatedOrdersResponseDto {
  @ApiProperty() page!: number;
  @ApiProperty() limit!: number;
  @ApiProperty() totalItems!: number;
  @ApiProperty() totalPages!: number;
  @ApiProperty() hasNextPage!: boolean;
  @ApiProperty({ type: OrderListItemResponseDto, isArray: true })
  items!: OrderListItemResponseDto[];
}
