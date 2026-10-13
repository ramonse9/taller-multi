import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { RFC_PATTERN } from '../../clients/rfc-validation';

const normalizeNullableText = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') || null : value;

const normalizeNullableFiscalName = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string'
    ? value.trim().replace(/\s+/g, ' ').toLocaleUpperCase('es-MX') || null
    : value;

const normalizeNullableUppercase = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim().toUpperCase() || null : value;

export enum InvoiceMode {
  Disabled = 'disabled',
  Simulation = 'simulation',
}

export enum IssuerType {
  Person = 'person',
  Company = 'company',
}

export enum IssuerReadinessMissingCode {
  FiscalNameRequired = 'FISCAL_NAME_REQUIRED',
  TaxIdRequired = 'RFC_REQUIRED',
  FiscalRegimeRequired = 'FISCAL_REGIME_REQUIRED',
  FiscalPostalCodeRequired = 'FISCAL_POSTAL_CODE_REQUIRED',
}

export enum IssuerReadinessIssueCode {
  IssuerTypeUnsupported = 'ISSUER_TYPE_UNSUPPORTED',
  TaxIdInvalid = 'RFC_INVALID',
  GenericTaxIdNotAllowed = 'GENERIC_RFC_NOT_ALLOWED_FOR_ISSUER',
  TaxIdIncompatible = 'RFC_INCOMPATIBLE_WITH_ISSUER_TYPE',
  FiscalRegimeNotFound = 'FISCAL_REGIME_NOT_FOUND',
  FiscalRegimeInactive = 'FISCAL_REGIME_INACTIVE',
  FiscalRegimeIncompatible = 'FISCAL_REGIME_INCOMPATIBLE_WITH_ISSUER_TYPE',
  FiscalPostalCodeInvalid = 'FISCAL_POSTAL_CODE_INVALID',
}

export class UpdateInvoiceSettingsDto {
  @ApiPropertyOptional({
    example: 'TALLER DEMOSTRACIÓN SA DE CV',
    nullable: true,
    description: 'Nombre o razón social exactamente como aparece en la constancia fiscal',
  })
  @Transform(normalizeNullableFiscalName)
  @IsOptional()
  @IsString()
  @Length(2, 180)
  fiscalName?: string | null;

  @ApiPropertyOptional({
    example: 'TDE010101AB1',
    nullable: true,
    description: 'RFC ordinario del emisor; los RFC genéricos no son válidos como emisor',
  })
  @Transform(normalizeNullableUppercase)
  @IsOptional()
  @IsString()
  @Matches(RFC_PATTERN, { message: 'El RFC del emisor tiene una estructura inválida' })
  taxId?: string | null;

  @ApiPropertyOptional({ example: '601', nullable: true })
  @Transform(normalizeNullableUppercase)
  @IsOptional()
  @IsString()
  @Matches(/^\d{3}$/, {
    message: 'fiscalRegimeCode debe contener exactamente 3 dígitos',
  })
  fiscalRegimeCode?: string | null;

  @ApiPropertyOptional({ example: '80000', nullable: true })
  @Transform(normalizeNullableText)
  @IsOptional()
  @IsString()
  @Matches(/^\d{5}$/, {
    message: 'fiscalPostalCode debe contener exactamente 5 dígitos',
  })
  fiscalPostalCode?: string | null;

  @ApiPropertyOptional({ example: 'A', default: 'A', maxLength: 25 })
  @Transform(normalizeNullableUppercase)
  @IsOptional()
  @IsString()
  @Matches(/^[A-Z0-9_-]{1,25}$/, {
    message: 'defaultSeries solamente admite letras, números, guion y guion bajo',
  })
  defaultSeries?: string;

  @ApiPropertyOptional({ example: 1, minimum: 1, maximum: 2147483647 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(2147483647)
  nextInternalFolio?: number;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsBoolean()
  pricesIncludeTax?: boolean | null;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class ChangeInvoiceModeDto {
  @ApiProperty({ enum: InvoiceMode })
  @IsEnum(InvoiceMode)
  mode!: InvoiceMode;
}

export class IssuerReadinessMissingFieldDto {
  @ApiProperty({ enum: IssuerReadinessMissingCode })
  code!: IssuerReadinessMissingCode;

  @ApiProperty({ example: 'taxId' })
  field!: string;

  @ApiProperty({ example: 'Falta el RFC del emisor.' })
  message!: string;
}

export class IssuerReadinessValidationIssueDto {
  @ApiProperty({ enum: IssuerReadinessIssueCode })
  code!: IssuerReadinessIssueCode;

  @ApiProperty({ example: 'fiscalRegimeCode' })
  field!: string;

  @ApiProperty({ example: 'El régimen fiscal del emisor está inactivo.' })
  message!: string;
}

export class IssuerReadinessResponseDto {
  @ApiProperty()
  isIssuerProfileComplete!: boolean;

  @ApiProperty({ type: IssuerReadinessMissingFieldDto, isArray: true })
  missingFields!: IssuerReadinessMissingFieldDto[];

  @ApiProperty({ type: IssuerReadinessValidationIssueDto, isArray: true })
  validationIssues!: IssuerReadinessValidationIssueDto[];
}

export class InvoiceSettingsResponseDto {
  @ApiProperty({ enum: InvoiceMode }) mode!: InvoiceMode;
  @ApiProperty({ enum: IssuerType, nullable: true }) issuerType!: IssuerType | null;
  @ApiProperty({ nullable: true, type: String }) fiscalName!: string | null;
  @ApiProperty({ nullable: true, type: String }) taxId!: string | null;
  @ApiProperty({ nullable: true, type: String }) fiscalRegimeCode!: string | null;
  @ApiProperty({ nullable: true, type: String }) fiscalRegimeName!: string | null;
  @ApiProperty({ nullable: true, type: String }) fiscalPostalCode!: string | null;
  @ApiProperty() defaultSeries!: string;
  @ApiProperty({ minimum: 1 }) nextInternalFolio!: number;
  @ApiProperty({ nullable: true, type: Boolean }) pricesIncludeTax!: boolean | null;
  @ApiProperty({ enum: ['MXN'] }) currencyCode!: 'MXN';
  @ApiProperty() isActive!: boolean;
  @ApiProperty({ type: IssuerReadinessResponseDto }) readiness!: IssuerReadinessResponseDto;
  @ApiProperty({ nullable: true, type: String, format: 'uuid' })
  updatedByUserId!: string | null;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}

export class PlatformInvoiceModeResponseDto {
  @ApiProperty({ format: 'uuid' }) companyId!: string;
  @ApiProperty({ enum: InvoiceMode }) mode!: InvoiceMode;
  @ApiProperty() isActive!: boolean;
  @ApiProperty() isIssuerProfileComplete!: boolean;
}
