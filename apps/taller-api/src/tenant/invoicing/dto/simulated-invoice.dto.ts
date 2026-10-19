import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

const uppercase = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim().toUpperCase() : value;

export enum SimulatedInvoiceStatus {
  Draft = 'draft',
  Issued = 'issued',
  Cancelled = 'cancelled',
  Discarded = 'discarded',
}

export enum InvoiceCollectionStatus {
  Pending = 'pending',
  Paid = 'paid',
}

export class SimulatedInvoiceTaxInputDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  orderItemId!: string;

  @ApiProperty({ enum: ['01', '02'], description: 'Objeto de impuesto soportado' })
  @IsIn(['01', '02'])
  taxObjectCode!: '01' | '02';

  @ApiPropertyOptional({ enum: ['001', '002', '003'], nullable: true })
  @Transform(uppercase)
  @IsOptional()
  @Matches(/^\d{3}$/)
  taxCode?: string | null;

  @ApiPropertyOptional({ enum: ['Tasa', 'Exento'], nullable: true })
  @IsOptional()
  @IsIn(['Tasa', 'Exento'])
  factorTypeCode?: 'Tasa' | 'Exento' | null;

  @ApiPropertyOptional({ example: 0.16, nullable: true, minimum: 0, maximum: 1 })
  @Type(() => Number)
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 6 })
  @Min(0)
  @Max(1)
  taxRate?: number | null;
}

export class CreateSimulatedInvoiceDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  orderId!: string;

  @ApiProperty({ example: 'G03' })
  @Transform(uppercase)
  @IsString()
  @Length(3, 4)
  cfdiUseCode!: string;

  @ApiProperty({ example: '03' })
  @Transform(uppercase)
  @Matches(/^\d{2}$/)
  paymentFormCode!: string;

  @ApiProperty({ enum: ['PUE', 'PPD'] })
  @Transform(uppercase)
  @IsIn(['PUE', 'PPD'])
  paymentMethodCode!: 'PUE' | 'PPD';

  @ApiPropertyOptional({ default: '01' })
  @Transform(uppercase)
  @IsOptional()
  @Matches(/^\d{2}$/)
  exportCode = '01';

  @ApiPropertyOptional({ type: SimulatedInvoiceTaxInputDto, isArray: true })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SimulatedInvoiceTaxInputDto)
  items?: SimulatedInvoiceTaxInputDto[];
}

export class UpdateSimulatedInvoiceDto {
  @ApiPropertyOptional({ example: 'G03' })
  @Transform(uppercase)
  @IsOptional()
  @IsString()
  @Length(3, 4)
  cfdiUseCode?: string;

  @ApiPropertyOptional({ example: '03' })
  @Transform(uppercase)
  @IsOptional()
  @Matches(/^\d{2}$/)
  paymentFormCode?: string;

  @ApiPropertyOptional({ enum: ['PUE', 'PPD'] })
  @Transform(uppercase)
  @IsOptional()
  @IsIn(['PUE', 'PPD'])
  paymentMethodCode?: 'PUE' | 'PPD';

  @ApiPropertyOptional({ default: '01' })
  @Transform(uppercase)
  @IsOptional()
  @Matches(/^\d{2}$/)
  exportCode?: string;

  @ApiPropertyOptional({ type: SimulatedInvoiceTaxInputDto, isArray: true })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SimulatedInvoiceTaxInputDto)
  items?: SimulatedInvoiceTaxInputDto[];
}

export class SimulatedInvoiceQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ default: 20, maximum: 100 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;

  @ApiPropertyOptional({ enum: SimulatedInvoiceStatus })
  @IsOptional()
  @IsEnum(SimulatedInvoiceStatus)
  status?: SimulatedInvoiceStatus;
}

export class FiscalCatalogEntryDto {
  @ApiProperty() code!: string;
  @ApiProperty() description!: string;
  @ApiProperty() isActive!: boolean;
  @ApiProperty() simulationSupported!: boolean;
}

export class TaxRateCatalogEntryDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() taxCode!: string;
  @ApiProperty() factorTypeCode!: string;
  @ApiProperty({ nullable: true, type: String }) rate!: string | null;
  @ApiProperty() description!: string;
  @ApiProperty() isActive!: boolean;
  @ApiProperty() simulationSupported!: boolean;
}

export class SimulatedInvoiceCatalogsResponseDto {
  @ApiProperty({ type: FiscalCatalogEntryDto, isArray: true }) cfdiUses!: FiscalCatalogEntryDto[];
  @ApiProperty({ type: FiscalCatalogEntryDto, isArray: true }) taxObjects!: FiscalCatalogEntryDto[];
  @ApiProperty({ type: FiscalCatalogEntryDto, isArray: true }) taxes!: FiscalCatalogEntryDto[];
  @ApiProperty({ type: FiscalCatalogEntryDto, isArray: true })
  factorTypes!: FiscalCatalogEntryDto[];
  @ApiProperty({ type: TaxRateCatalogEntryDto, isArray: true }) taxRates!: TaxRateCatalogEntryDto[];
  @ApiProperty({ type: FiscalCatalogEntryDto, isArray: true })
  paymentForms!: FiscalCatalogEntryDto[];
  @ApiProperty({ type: FiscalCatalogEntryDto, isArray: true })
  paymentMethods!: FiscalCatalogEntryDto[];
  @ApiProperty({ type: FiscalCatalogEntryDto, isArray: true })
  exportCodes!: FiscalCatalogEntryDto[];
}

export class SimulatedInvoiceItemResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid', nullable: true, type: String }) orderItemId!: string | null;
  @ApiProperty() position!: number;
  @ApiProperty() description!: string;
  @ApiProperty({ nullable: true, type: String }) productServiceCode!: string | null;
  @ApiProperty({ nullable: true, type: String }) unitCode!: string | null;
  @ApiProperty() unitName!: string;
  @ApiProperty() quantity!: string;
  @ApiProperty() unitPrice!: string;
  @ApiProperty() taxObjectCode!: string;
  @ApiProperty({ nullable: true, type: String }) taxCode!: string | null;
  @ApiProperty({ nullable: true, type: String }) factorTypeCode!: string | null;
  @ApiProperty({ nullable: true, type: String }) taxRate!: string | null;
  @ApiProperty() baseAmount!: string;
  @ApiProperty() taxAmount!: string;
  @ApiProperty() total!: string;
}

export class SimulatedInvoiceEventResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ enum: ['created', 'updated', 'issued', 'cancelled', 'discarded'] })
  eventType!: string;
  @ApiProperty({ type: Object }) details!: Record<string, unknown>;
  @ApiProperty({ format: 'uuid' }) actorUserId!: string;
  @ApiProperty() actorName!: string;
  @ApiProperty() createdAt!: Date;
}

export class SimulatedInvoiceResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) orderId!: string;
  @ApiProperty() orderFolio!: string;
  @ApiProperty({ enum: SimulatedInvoiceStatus }) status!: SimulatedInvoiceStatus;
  @ApiProperty({ nullable: true, type: String }) series!: string | null;
  @ApiProperty({ nullable: true, type: Number }) folio!: number | null;
  @ApiProperty({ example: 'Simulación sin validez fiscal' }) documentLabel!: string;
  @ApiProperty({
    enum: InvoiceCollectionStatus,
    description: 'Estatus de cobro derivado de la orden; no es un estatus fiscal',
  })
  collectionStatus!: InvoiceCollectionStatus;
  @ApiProperty({
    nullable: true,
    type: Date,
    description: 'Fecha de pago de la orden relacionada; no se almacena en la factura',
  })
  orderPaidAt!: Date | null;
  @ApiProperty() issuerFiscalName!: string;
  @ApiProperty() issuerTaxId!: string;
  @ApiProperty() issuerFiscalRegimeCode!: string;
  @ApiProperty() issuerPostalCode!: string;
  @ApiProperty() receiverFiscalName!: string;
  @ApiProperty() receiverTaxId!: string;
  @ApiProperty() receiverFiscalRegimeCode!: string;
  @ApiProperty() receiverPostalCode!: string;
  @ApiProperty() cfdiUseCode!: string;
  @ApiProperty() paymentFormCode!: string;
  @ApiProperty() paymentMethodCode!: string;
  @ApiProperty() exportCode!: string;
  @ApiProperty({ enum: ['MXN'] }) currencyCode!: 'MXN';
  @ApiProperty() pricesIncludeTax!: boolean;
  @ApiProperty() subtotal!: string;
  @ApiProperty() transferredTax!: string;
  @ApiProperty() total!: string;
  @ApiProperty({ nullable: true, type: Date }) issuedAt!: Date | null;
  @ApiProperty({ nullable: true, type: Date }) cancelledAt!: Date | null;
  @ApiProperty({ nullable: true, type: Date }) discardedAt!: Date | null;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
  @ApiProperty({ type: SimulatedInvoiceItemResponseDto, isArray: true })
  items!: SimulatedInvoiceItemResponseDto[];
  @ApiProperty({ type: SimulatedInvoiceEventResponseDto, isArray: true })
  events!: SimulatedInvoiceEventResponseDto[];
}

export class PaginatedSimulatedInvoicesResponseDto {
  @ApiProperty() page!: number;
  @ApiProperty() limit!: number;
  @ApiProperty() totalItems!: number;
  @ApiProperty() totalPages!: number;
  @ApiProperty() hasNextPage!: boolean;
  @ApiProperty({ type: SimulatedInvoiceResponseDto, isArray: true })
  items!: SimulatedInvoiceResponseDto[];
}
