import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  Max,
  Min,
} from 'class-validator';

const maxModelYear = new Date().getFullYear() + 1;

const trimString = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

const normalizeNullableUppercase = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim().toUpperCase() || null : value;

export class CreateVehicleDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  brandId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  modelId!: string;

  @ApiProperty({ example: 2024, minimum: 1886, maximum: maxModelYear })
  @IsInt()
  @Min(1886)
  @Max(maxModelYear)
  year!: number;

  @ApiProperty({ example: 'Blanco', minLength: 1, maxLength: 50 })
  @Transform(trimString)
  @IsString()
  @Length(1, 50)
  color!: string;

  @ApiPropertyOptional({
    example: 'A123456789',
    nullable: true,
    description: 'Últimos 10 caracteres del VIN, sin I, O ni Q',
  })
  @Transform(normalizeNullableUppercase)
  @IsOptional()
  @IsString()
  @Matches(/^[A-HJ-NPR-Z0-9]{10}$/, {
    message: 'numeroSerie debe contener exactamente los últimos 10 caracteres válidos del VIN',
  })
  numeroSerie?: string | null;

  @ApiPropertyOptional({ example: 'ABC-123-D', nullable: true, maxLength: 20 })
  @Transform(normalizeNullableUppercase)
  @IsOptional()
  @IsString()
  @Length(1, 20)
  licensePlate?: string | null;
}

export class UpdateVehicleDto extends PartialType(CreateVehicleDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class VehicleResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) customerId!: string;
  @ApiProperty({ format: 'uuid' }) brandId!: string;
  @ApiProperty() brandName!: string;
  @ApiProperty({ format: 'uuid' }) modelId!: string;
  @ApiProperty() modelName!: string;
  @ApiProperty() year!: number;
  @ApiProperty() color!: string;
  @ApiProperty({ nullable: true, type: String }) numeroSerie!: string | null;
  @ApiProperty({ nullable: true, type: String }) licensePlate!: string | null;
  @ApiProperty() isActive!: boolean;
  @ApiProperty({ format: 'uuid' }) createdByUserId!: string;
  @ApiProperty({ format: 'uuid' }) updatedByUserId!: string;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}

export class VehicleHistoryQueryDto {
  @ApiProperty({ example: 'A123456789', minLength: 10, maxLength: 10 })
  @Transform(normalizeNullableUppercase)
  @IsString()
  @Matches(/^[A-HJ-NPR-Z0-9]{10}$/, {
    message: 'numeroSerie debe contener exactamente los últimos 10 caracteres válidos del VIN',
  })
  numeroSerie!: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Permite limitar coincidencias a una marca específica',
  })
  @IsOptional()
  @IsUUID()
  brandId?: string;
}

export class VehicleHistoryOrderDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ description: 'Folio de la orden; se entrega como texto por ser bigint' })
  folio!: string;
  @ApiProperty() status!: string;
  @ApiProperty() openedAt!: Date;
  @ApiProperty({ nullable: true, type: Date }) closedAt!: Date | null;
}

export class VehicleHistoryMatchDto extends VehicleResponseDto {
  @ApiProperty() customerName!: string;
  @ApiProperty({ type: VehicleHistoryOrderDto, isArray: true })
  orders!: VehicleHistoryOrderDto[];
}

export class VehicleHistoryResponseDto {
  @ApiProperty() numeroSerie!: string;
  @ApiProperty({ nullable: true, type: String }) brandId!: string | null;
  @ApiProperty() totalClients!: number;
  @ApiProperty() totalVehicles!: number;
  @ApiProperty() totalOrders!: number;
  @ApiProperty({ type: VehicleHistoryMatchDto, isArray: true })
  matches!: VehicleHistoryMatchDto[];
}
