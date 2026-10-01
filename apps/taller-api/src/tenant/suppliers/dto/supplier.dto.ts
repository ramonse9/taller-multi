import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  Min,
} from 'class-validator';

const trimNullable = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') || null : value;

const lowerEmail = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim().toLowerCase() || null : value;

const upperTaxId = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim().toUpperCase() || null : value;

export class CreateSupplierDto {
  @ApiProperty({ example: 'Refaccionaria del Pacífico' })
  @Transform(trimNullable)
  @IsString()
  @Length(2, 180)
  commercialName!: string;

  @ApiPropertyOptional({ nullable: true, example: 'Refacciones del Pacífico, S.A. de C.V.' })
  @Transform(trimNullable)
  @IsOptional()
  @IsString()
  @Length(2, 180)
  legalName?: string | null;

  @ApiPropertyOptional({ nullable: true, example: 'RPA010101AB1' })
  @Transform(upperTaxId)
  @IsOptional()
  @IsString()
  @Matches(/^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/, { message: 'taxId debe ser un RFC válido' })
  taxId?: string | null;

  @ApiPropertyOptional({ nullable: true, example: '+526671223344' })
  @Transform(trimNullable)
  @IsOptional()
  @IsString()
  @Length(3, 30)
  phone?: string | null;

  @ApiPropertyOptional({ nullable: true, example: 'ventas@proveedor.mx' })
  @Transform(lowerEmail)
  @IsOptional()
  @IsEmail()
  @Length(3, 254)
  email?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @Transform(trimNullable)
  @IsOptional()
  @IsString()
  @Length(1, 2000)
  notes?: string | null;
}

export class UpdateSupplierDto extends PartialType(CreateSupplierDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class SupplierQueryDto {
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

  @ApiPropertyOptional({ default: true })
  @Transform(({ value }: { value: unknown }) => {
    if (value === undefined || value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @IsBoolean()
  isActive = true;
}

export class SupplierResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() commercialName!: string;
  @ApiProperty({ nullable: true, type: String }) legalName!: string | null;
  @ApiProperty({ nullable: true, type: String }) taxId!: string | null;
  @ApiProperty({ nullable: true, type: String }) phone!: string | null;
  @ApiProperty({ nullable: true, type: String }) email!: string | null;
  @ApiProperty({ nullable: true, type: String }) notes!: string | null;
  @ApiProperty() isActive!: boolean;
  @ApiProperty({ description: 'Proveedor predeterminado protegido del sistema' })
  isDefault!: boolean;
  @ApiProperty({ format: 'uuid', nullable: true, type: String })
  createdByUserId!: string | null;
  @ApiProperty({ format: 'uuid', nullable: true, type: String })
  updatedByUserId!: string | null;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}

export class PaginatedSuppliersResponseDto {
  @ApiProperty() page!: number;
  @ApiProperty() limit!: number;
  @ApiProperty() totalItems!: number;
  @ApiProperty() totalPages!: number;
  @ApiProperty() hasNextPage!: boolean;
  @ApiProperty({ type: SupplierResponseDto, isArray: true })
  items!: SupplierResponseDto[];
}
