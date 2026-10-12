import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { RFC_PATTERN } from '../rfc-validation';

const trimNullableString = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() || null : value;

const normalizeNullableEmail = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim().toLowerCase() || null : value;

const normalizeNullableTaxId = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim().toUpperCase() || null : value;

const normalizeNullableFiscalName = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string'
    ? value.trim().replace(/\s+/g, ' ').toLocaleUpperCase('es-MX') || null
    : value;

const normalizeNullableUppercaseCode = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim().toUpperCase() || null : value;

export enum CustomerType {
  Person = 'person',
  Company = 'company',
}

export class CreateClientDto {
  @ApiProperty({ enum: CustomerType, default: CustomerType.Person })
  @IsEnum(CustomerType)
  type!: CustomerType;

  @ApiProperty({ example: 'Ana López' })
  @Transform(trimNullableString)
  @IsString()
  @Length(2, 180)
  displayName!: string;

  @ApiPropertyOptional({ example: 'Transportes del Pacífico, S.A. de C.V.', nullable: true })
  @Transform(trimNullableString)
  @IsOptional()
  @IsString()
  @Length(2, 180)
  legalName?: string | null;

  @ApiPropertyOptional({ example: 'Pedro López', nullable: true })
  @Transform(trimNullableString)
  @IsOptional()
  @IsString()
  @Length(2, 180)
  contactName?: string | null;

  @ApiPropertyOptional({
    example: 'LOPA900101AB1',
    nullable: true,
    description:
      'RFC opcional: 13 caracteres para persona física, 12 para persona moral; admite los genéricos XAXX010101000 y XEXX010101000',
  })
  @Transform(normalizeNullableTaxId)
  @IsOptional()
  @IsString()
  @Matches(RFC_PATTERN, { message: 'El RFC tiene una estructura inválida' })
  taxId?: string | null;

  @ApiPropertyOptional({
    example: 'ANA LÓPEZ PÉREZ',
    nullable: true,
    minLength: 2,
    maxLength: 180,
    description: 'Nombre o razón social exactamente como aparece en la constancia fiscal',
  })
  @Transform(normalizeNullableFiscalName)
  @IsOptional()
  @IsString()
  @Length(2, 180)
  fiscalName?: string | null;

  @ApiPropertyOptional({ example: '80000', nullable: true, minLength: 5, maxLength: 5 })
  @Transform(trimNullableString)
  @IsOptional()
  @IsString()
  @Matches(/^\d{5}$/, { message: 'fiscalPostalCode debe contener exactamente 5 dígitos' })
  fiscalPostalCode?: string | null;

  @ApiPropertyOptional({
    example: '612',
    nullable: true,
    minLength: 3,
    maxLength: 3,
    description: 'Clave del catálogo de regímenes fiscales del SAT',
  })
  @Transform(normalizeNullableUppercaseCode)
  @IsOptional()
  @IsString()
  @Matches(/^\d{3}$/, { message: 'fiscalRegimeCode debe contener exactamente 3 dígitos' })
  fiscalRegimeCode?: string | null;

  @ApiPropertyOptional({
    example: 'G03',
    nullable: true,
    minLength: 3,
    maxLength: 4,
    description:
      'Clave vigente del catálogo c_UsoCFDI. Requiere régimen fiscal y debe ser compatible con el tipo de persona y dicho régimen',
  })
  @Transform(normalizeNullableUppercaseCode)
  @IsOptional()
  @IsString()
  @Matches(/^[A-Z0-9]{3,4}$/, {
    message: 'preferredCfdiUseCode debe ser una clave válida de 3 o 4 caracteres',
  })
  preferredCfdiUseCode?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @Transform(normalizeNullableEmail)
  @IsOptional()
  @IsEmail()
  @Length(3, 254)
  email?: string | null;

  @ApiPropertyOptional({ example: '6671234567', nullable: true })
  @Transform(trimNullableString)
  @IsOptional()
  @IsString()
  @Length(3, 30)
  phone?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @Transform(trimNullableString)
  @IsOptional()
  @IsString()
  @Length(1, 2000)
  notes?: string | null;
}

export class UpdateClientDto extends PartialType(CreateClientDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class ClientQueryDto {
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

export class FiscalRegimeQueryDto {
  @ApiPropertyOptional({
    enum: CustomerType,
    description: 'Limita el catálogo a regímenes compatibles con persona física o moral',
  })
  @IsOptional()
  @IsEnum(CustomerType)
  customerType?: CustomerType;
}

export class FiscalRegimeResponseDto {
  @ApiProperty({ example: '612' }) code!: string;
  @ApiProperty({ example: 'Personas Físicas con Actividades Empresariales y Profesionales' })
  name!: string;
  @ApiProperty() supportsPerson!: boolean;
  @ApiProperty() supportsCompany!: boolean;
}

export class CfdiUseQueryDto {
  @ApiPropertyOptional({
    enum: CustomerType,
    description: 'Limita el catálogo a usos compatibles con persona física o moral',
  })
  @IsOptional()
  @IsEnum(CustomerType)
  customerType?: CustomerType;

  @ApiPropertyOptional({
    example: '612',
    description: 'Limita el catálogo a usos compatibles con este régimen fiscal del SAT',
  })
  @Transform(normalizeNullableUppercaseCode)
  @IsOptional()
  @IsString()
  @Matches(/^\d{3}$/, { message: 'fiscalRegimeCode debe contener exactamente 3 dígitos' })
  fiscalRegimeCode?: string;
}

export class CfdiUseResponseDto {
  @ApiProperty({ example: 'G03' }) code!: string;
  @ApiProperty({ example: 'Gastos en general.' }) description!: string;
  @ApiProperty() supportsPerson!: boolean;
  @ApiProperty() supportsCompany!: boolean;
  @ApiProperty({ example: '2022-01-01' }) validFrom!: string;
  @ApiProperty({ example: null, nullable: true, type: String }) validTo!: string | null;
  @ApiProperty() isActive!: boolean;
}

export enum FiscalReadinessMissingCode {
  TaxIdRequired = 'RFC_REQUIRED',
  FiscalNameRequired = 'FISCAL_NAME_REQUIRED',
  FiscalPostalCodeRequired = 'FISCAL_POSTAL_CODE_REQUIRED',
  FiscalRegimeRequired = 'FISCAL_REGIME_REQUIRED',
  CfdiUseRequired = 'CFDI_USE_REQUIRED',
}

export enum FiscalReadinessIssueCode {
  TaxIdInvalid = 'RFC_INVALID',
  TaxIdIncompatible = 'RFC_INCOMPATIBLE_WITH_CUSTOMER_TYPE',
  FiscalPostalCodeInvalid = 'FISCAL_POSTAL_CODE_INVALID',
  FiscalRegimeNotFound = 'FISCAL_REGIME_NOT_FOUND',
  FiscalRegimeInactive = 'FISCAL_REGIME_INACTIVE',
  FiscalRegimeIncompatible = 'FISCAL_REGIME_INCOMPATIBLE_WITH_CUSTOMER_TYPE',
  CfdiUseNotFound = 'CFDI_USE_NOT_FOUND',
  CfdiUseInactive = 'CFDI_USE_INACTIVE',
  CfdiUseOutOfValidity = 'CFDI_USE_OUT_OF_VALIDITY',
  CfdiUseIncompatibleWithCustomerType = 'CFDI_USE_INCOMPATIBLE_WITH_CUSTOMER_TYPE',
  CfdiUseIncompatibleWithFiscalRegime = 'CFDI_USE_INCOMPATIBLE_WITH_FISCAL_REGIME',
}

export class FiscalReadinessMissingFieldDto {
  @ApiProperty({ enum: FiscalReadinessMissingCode, example: 'RFC_REQUIRED' })
  code!: FiscalReadinessMissingCode;

  @ApiProperty({ example: 'taxId' })
  field!: string;

  @ApiProperty({ example: 'Falta el RFC.' })
  message!: string;
}

export class FiscalReadinessValidationIssueDto {
  @ApiProperty({ enum: FiscalReadinessIssueCode, example: 'FISCAL_REGIME_INACTIVE' })
  code!: FiscalReadinessIssueCode;

  @ApiProperty({ example: 'fiscalRegimeCode' })
  field!: string;

  @ApiProperty({ example: 'El régimen fiscal está inactivo.' })
  message!: string;
}

export class FiscalReadinessResponseDto {
  @ApiProperty({ description: 'Indica si RFC, nombre, código postal y régimen son válidos' })
  isFiscalProfileComplete!: boolean;

  @ApiProperty({ description: 'Indica si además existe un Uso CFDI vigente y compatible' })
  isReadyToInvoice!: boolean;

  @ApiProperty({ type: FiscalReadinessMissingFieldDto, isArray: true })
  missingFields!: FiscalReadinessMissingFieldDto[];

  @ApiProperty({ type: FiscalReadinessValidationIssueDto, isArray: true })
  validationIssues!: FiscalReadinessValidationIssueDto[];
}

export class ClientResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ enum: CustomerType }) type!: CustomerType;
  @ApiProperty() displayName!: string;
  @ApiProperty({ nullable: true, type: String }) legalName!: string | null;
  @ApiProperty({ nullable: true, type: String }) contactName!: string | null;
  @ApiProperty({ nullable: true, type: String }) taxId!: string | null;
  @ApiProperty({ nullable: true, type: String, minLength: 2, maxLength: 180 })
  fiscalName!: string | null;
  @ApiProperty({ nullable: true, type: String, minLength: 5, maxLength: 5 })
  fiscalPostalCode!: string | null;
  @ApiProperty({ nullable: true, type: String, minLength: 3, maxLength: 3 })
  fiscalRegimeCode!: string | null;
  @ApiProperty({ nullable: true, type: String, minLength: 3, maxLength: 4 })
  preferredCfdiUseCode!: string | null;
  @ApiProperty({ type: FiscalReadinessResponseDto })
  fiscalReadiness!: FiscalReadinessResponseDto;
  @ApiProperty({ nullable: true, type: String }) email!: string | null;
  @ApiProperty({ nullable: true, type: String }) phone!: string | null;
  @ApiProperty({ nullable: true, type: String }) notes!: string | null;
  @ApiProperty() isActive!: boolean;
  @ApiProperty({ format: 'uuid' }) createdByUserId!: string;
  @ApiProperty({ format: 'uuid' }) updatedByUserId!: string;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}

export class ClientListItemResponseDto extends ClientResponseDto {
  @ApiProperty({ minimum: 0, description: 'Cantidad total de vehículos asociados al cliente' })
  vehicleCount!: number;

  @ApiProperty({ minimum: 0, description: 'Cantidad total de órdenes asociadas al cliente' })
  orderCount!: number;
}

export class PaginatedClientsResponseDto {
  @ApiProperty() page!: number;
  @ApiProperty() limit!: number;
  @ApiProperty() totalItems!: number;
  @ApiProperty() totalPages!: number;
  @ApiProperty() hasNextPage!: boolean;
  @ApiProperty({ type: ClientListItemResponseDto, isArray: true })
  items!: ClientListItemResponseDto[];
}

export class ClientsTotalResponseDto {
  @ApiProperty() total!: number;
}
