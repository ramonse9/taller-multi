import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

const nullableText = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() || null : value;

const cleanText = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

export enum PurchaseStatus {
  Draft = 'draft',
  Confirmed = 'confirmed',
  Cancelled = 'cancelled',
}

export class PurchaseItemInputDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  productId!: string;

  @ApiProperty({ example: 10, minimum: 0.001 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3, allowInfinity: false, allowNaN: false })
  @Min(0.001)
  @Max(999999999.999)
  quantity!: number;

  @ApiProperty({ example: 105.5, minimum: 0 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2, allowInfinity: false, allowNaN: false })
  @Min(0)
  @Max(999999999999.99)
  unitCost!: number;
}

export class CreatePurchaseDto {
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Si se omite, se utiliza Proveedor general',
  })
  @IsOptional()
  @IsUUID('4')
  supplierId?: string;

  @ApiPropertyOptional({ format: 'date-time', description: 'Fecha de la compra' })
  @IsOptional()
  @IsDateString()
  purchasedAt?: string;

  @ApiPropertyOptional({ nullable: true, maxLength: 120 })
  @Transform(nullableText)
  @IsOptional()
  @IsString()
  @Length(1, 120)
  reference?: string | null;

  @ApiPropertyOptional({ nullable: true, maxLength: 2000 })
  @Transform(nullableText)
  @IsOptional()
  @IsString()
  @Length(1, 2000)
  notes?: string | null;

  @ApiProperty({ type: PurchaseItemInputDto, isArray: true, minItems: 1, maxItems: 100 })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => PurchaseItemInputDto)
  items!: PurchaseItemInputDto[];
}

export class UpdatePurchaseDto extends PartialType(CreatePurchaseDto) {}

export class ChangePurchaseStatusDto {
  @ApiProperty({ enum: [PurchaseStatus.Confirmed, PurchaseStatus.Cancelled] })
  @IsEnum(PurchaseStatus)
  status!: PurchaseStatus;
}

export class PurchaseQueryDto {
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

  @ApiPropertyOptional({ default: '', maxLength: 120 })
  @Transform(cleanText)
  @IsOptional()
  @IsString()
  @Length(0, 120)
  search = '';

  @ApiPropertyOptional({ enum: PurchaseStatus })
  @IsOptional()
  @IsEnum(PurchaseStatus)
  status?: PurchaseStatus;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('4')
  supplierId?: string;
}

export class PurchaseSupplierResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() commercialName!: string;
  @ApiProperty() isDefault!: boolean;
}

export class PurchaseItemResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) productId!: string;
  @ApiProperty({ format: 'uuid', nullable: true, type: String })
  inventoryMovementId!: string | null;
  @ApiProperty({ format: 'uuid', nullable: true, type: String })
  inventoryLotId!: string | null;
  @ApiProperty() position!: number;
  @ApiProperty() productName!: string;
  @ApiProperty({ nullable: true, type: String }) productSku!: string | null;
  @ApiProperty() unitName!: string;
  @ApiProperty() unitSymbol!: string;
  @ApiProperty({ description: 'Decimal entregado como texto' }) quantity!: string;
  @ApiProperty({ description: 'Importe monetario entregado como texto' }) unitCost!: string;
  @ApiProperty({ description: 'Importe monetario entregado como texto' }) amount!: string;
}

export class PurchaseStatusHistoryResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ enum: PurchaseStatus, nullable: true })
  previousStatus!: PurchaseStatus | null;
  @ApiProperty({ enum: PurchaseStatus }) newStatus!: PurchaseStatus;
  @ApiProperty({ format: 'uuid' }) changedByUserId!: string;
  @ApiProperty() changedByName!: string;
  @ApiProperty() changedAt!: Date;
}

export class PurchaseSummaryResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ description: 'Folio automático por compañía; bigint entregado como texto' })
  folio!: string;
  @ApiProperty({ enum: PurchaseStatus }) status!: PurchaseStatus;
  @ApiProperty({ type: PurchaseSupplierResponseDto }) supplier!: PurchaseSupplierResponseDto;
  @ApiProperty() purchasedAt!: Date;
  @ApiProperty({ nullable: true, type: String }) reference!: string | null;
  @ApiProperty({ nullable: true, type: String }) notes!: string | null;
  @ApiProperty({ description: 'Importe monetario entregado como texto' }) total!: string;
  @ApiProperty() itemCount!: number;
  @ApiProperty({ nullable: true, type: Date }) confirmedAt!: Date | null;
  @ApiProperty({ nullable: true, type: Date }) cancelledAt!: Date | null;
  @ApiProperty({ format: 'uuid' }) createdByUserId!: string;
  @ApiProperty({ format: 'uuid' }) updatedByUserId!: string;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}

export class PurchaseResponseDto extends PurchaseSummaryResponseDto {
  @ApiProperty({ type: PurchaseItemResponseDto, isArray: true })
  items!: PurchaseItemResponseDto[];
  @ApiProperty({ type: PurchaseStatusHistoryResponseDto, isArray: true })
  statusHistory!: PurchaseStatusHistoryResponseDto[];
}

export class PaginatedPurchasesResponseDto {
  @ApiProperty() page!: number;
  @ApiProperty() limit!: number;
  @ApiProperty() totalItems!: number;
  @ApiProperty() totalPages!: number;
  @ApiProperty() hasNextPage!: boolean;
  @ApiProperty({ type: PurchaseSummaryResponseDto, isArray: true })
  items!: PurchaseSummaryResponseDto[];
}

export class PurchaseCostVariationResponseDto {
  @ApiProperty({ format: 'uuid' }) productId!: string;
  @ApiProperty() productName!: string;
  @ApiProperty({ nullable: true, type: String }) productSku!: string | null;
  @ApiProperty({ description: 'Costo de la compra confirmada más reciente' })
  currentCost!: string;
  @ApiProperty({ description: 'Costo confirmado inmediatamente anterior' })
  previousCost!: string;
  @ApiProperty({ description: 'Diferencia monetaria entregada como texto' })
  changeAmount!: string;
  @ApiProperty({ description: 'Variación porcentual entregada como texto' })
  changePercent!: string;
  @ApiProperty({ enum: ['increase', 'decrease'] })
  direction!: 'increase' | 'decrease';
  @ApiProperty() lastPurchasedAt!: Date;
}

export class PurchaseIndicatorsResponseDto {
  @ApiProperty() confirmedLast30Days!: number;
  @ApiProperty({ description: 'Total confirmado de los últimos 30 días' })
  confirmedAmountLast30Days!: string;
  @ApiProperty() draftCount!: number;
  @ApiProperty({ description: 'Total acumulado en borradores' }) draftAmount!: string;
  @ApiProperty({ type: PurchaseSummaryResponseDto, isArray: true })
  recentPurchases!: PurchaseSummaryResponseDto[];
  @ApiProperty({ type: PurchaseCostVariationResponseDto, isArray: true })
  importantVariations!: PurchaseCostVariationResponseDto[];
}
