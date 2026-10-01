import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
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
  NotEquals,
} from 'class-validator';

const trimText = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : value;

const optionalBoolean = ({ value }: { value: unknown }): unknown => {
  if (value === undefined || value === '') return undefined;
  if (value === 'true' || value === true) return true;
  if (value === 'false' || value === false) return false;
  return value;
};

export enum InventoryMovementType {
  Entry = 'entry',
  Exit = 'exit',
  Adjustment = 'adjustment',
}

export class CreateInventoryMovementDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  productId!: string;

  @ApiProperty({ enum: InventoryMovementType })
  @IsEnum(InventoryMovementType)
  type!: InventoryMovementType;

  @ApiProperty({
    example: 5,
    description: 'Entrada y salida usan valores positivos; ajuste acepta signo',
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3, allowInfinity: false, allowNaN: false })
  @NotEquals(0)
  @Min(-99999999999.999)
  @Max(99999999999.999)
  quantity!: number;

  @ApiPropertyOptional({ example: 120.5, minimum: 0, nullable: true })
  @Type(() => Number)
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2, allowInfinity: false, allowNaN: false })
  @Min(0)
  @Max(999999999999.99)
  unitCost?: number | null;

  @ApiProperty({ example: 'Compra inicial al proveedor' })
  @Transform(trimText)
  @IsString()
  @Length(2, 250)
  reason!: string;
}

export class InventoryMovementQueryDto {
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

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('4')
  productId?: string;

  @ApiPropertyOptional({ enum: InventoryMovementType })
  @IsOptional()
  @IsEnum(InventoryMovementType)
  type?: InventoryMovementType;
}

export class InventoryProductQueryDto {
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
  @Transform(trimText)
  @IsOptional()
  @IsString()
  @Length(0, 100)
  search = '';

  @ApiPropertyOptional({ type: Boolean })
  @Transform(optionalBoolean)
  @IsOptional()
  @IsBoolean()
  lowStock?: boolean;

  @ApiPropertyOptional({ default: true })
  @Transform(({ value }: { value: unknown }) => {
    if (value === undefined || value === '' || value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @IsBoolean()
  isActive = true;
}

export class InventoryProductResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ nullable: true, type: String }) sku!: string | null;
  @ApiProperty() name!: string;
  @ApiProperty({ format: 'uuid' }) unitId!: string;
  @ApiProperty() unitName!: string;
  @ApiProperty() unitSymbol!: string;
  @ApiProperty() allowsDecimals!: boolean;
  @ApiProperty({ description: 'Decimal entregado como texto' }) stock!: string;
  @ApiProperty({ description: 'Decimal entregado como texto' }) minimumStock!: string;
  @ApiProperty() isLowStock!: boolean;
  @ApiProperty() isActive!: boolean;
}

export class PaginatedInventoryProductsResponseDto {
  @ApiProperty() page!: number;
  @ApiProperty() limit!: number;
  @ApiProperty() totalItems!: number;
  @ApiProperty() totalPages!: number;
  @ApiProperty() hasNextPage!: boolean;
  @ApiProperty({ type: InventoryProductResponseDto, isArray: true })
  items!: InventoryProductResponseDto[];
}

export class InventoryMovementResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) productId!: string;
  @ApiProperty() productName!: string;
  @ApiProperty({ nullable: true, type: String }) productSku!: string | null;
  @ApiProperty({ enum: InventoryMovementType }) type!: InventoryMovementType;
  @ApiProperty({ description: 'Variación con signo entregada como texto' }) quantity!: string;
  @ApiProperty({ description: 'Decimal entregado como texto' }) previousStock!: string;
  @ApiProperty({ description: 'Decimal entregado como texto' }) resultingStock!: string;
  @ApiProperty({ nullable: true, type: String }) unitCost!: string | null;
  @ApiProperty() reason!: string;
  @ApiProperty({ format: 'uuid' }) createdByUserId!: string;
  @ApiProperty() createdByName!: string;
  @ApiProperty() createdAt!: Date;
}

export class PaginatedInventoryMovementsResponseDto {
  @ApiProperty() page!: number;
  @ApiProperty() limit!: number;
  @ApiProperty() totalItems!: number;
  @ApiProperty() totalPages!: number;
  @ApiProperty() hasNextPage!: boolean;
  @ApiProperty({ type: InventoryMovementResponseDto, isArray: true })
  items!: InventoryMovementResponseDto[];
}
