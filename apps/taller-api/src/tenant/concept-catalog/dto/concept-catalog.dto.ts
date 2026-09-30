import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
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
  Matches,
  Max,
  Min,
} from 'class-validator';

const cleanText = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : value;

const nullableText = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() || null : value;

const nullableUppercase = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim().toUpperCase() || null : value;

const booleanQuery = ({ value }: { value: unknown }): unknown => {
  if (value === undefined || value === '') return true;
  if (value === 'true' || value === true) return true;
  if (value === 'false' || value === false) return false;
  return value;
};

export enum ConceptKind {
  Product = 'product',
  Service = 'service',
}

export class CreateMeasurementUnitDto {
  @ApiProperty({ example: 'Caja' })
  @Transform(cleanText)
  @IsString()
  @Length(1, 80)
  name!: string;

  @ApiProperty({ example: 'cja' })
  @Transform(cleanText)
  @IsString()
  @Length(1, 20)
  symbol!: string;

  @ApiPropertyOptional({ example: 'XBX', nullable: true })
  @Transform(nullableUppercase)
  @IsOptional()
  @IsString()
  @Matches(/^[A-Z0-9]{1,3}$/)
  satCode?: string | null;

  @ApiProperty({ default: true })
  @IsBoolean()
  allowsDecimals!: boolean;
}

export class UpdateMeasurementUnitDto extends PartialType(CreateMeasurementUnitDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class MeasurementUnitQueryDto {
  @ApiPropertyOptional({ default: true })
  @Transform(booleanQuery)
  @IsBoolean()
  isActive = true;
}

export class MeasurementUnitResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() symbol!: string;
  @ApiProperty({ nullable: true, type: String }) satCode!: string | null;
  @ApiProperty() allowsDecimals!: boolean;
  @ApiProperty() isActive!: boolean;
  @ApiProperty({ format: 'uuid', nullable: true, type: String })
  createdByUserId!: string | null;
  @ApiProperty({ format: 'uuid', nullable: true, type: String })
  updatedByUserId!: string | null;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}

export class CreateConceptDto {
  @ApiProperty({ enum: ConceptKind })
  @IsEnum(ConceptKind)
  kind!: ConceptKind;

  @ApiPropertyOptional({ example: 'ACE-5W30', nullable: true })
  @Transform(nullableUppercase)
  @IsOptional()
  @IsString()
  @Length(1, 80)
  sku?: string | null;

  @ApiProperty({ example: 'Aceite sintético 5W-30' })
  @Transform(cleanText)
  @IsString()
  @Length(1, 180)
  name!: string;

  @ApiPropertyOptional({ nullable: true })
  @Transform(nullableText)
  @IsOptional()
  @IsString()
  @Length(1, 2000)
  description?: string | null;

  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  unitId!: string;

  @ApiProperty({ example: 120, minimum: 0 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2, allowInfinity: false, allowNaN: false })
  @Min(0)
  @Max(999999999999.99)
  cost!: number;

  @ApiProperty({ example: 180, minimum: 0 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2, allowInfinity: false, allowNaN: false })
  @Min(0)
  @Max(999999999999.99)
  price!: number;

  @ApiProperty({ default: false })
  @IsBoolean()
  tracksInventory!: boolean;

  @ApiPropertyOptional({ example: '15121501', nullable: true })
  @Transform(nullableUppercase)
  @IsOptional()
  @IsString()
  @Matches(/^\d{8}$/)
  satProductServiceCode?: string | null;
}

export class UpdateConceptDto extends PartialType(CreateConceptDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class ConceptQueryDto {
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
  @Transform(cleanText)
  @IsOptional()
  @IsString()
  @Length(0, 100)
  search = '';

  @ApiPropertyOptional({ enum: ConceptKind })
  @IsOptional()
  @IsEnum(ConceptKind)
  kind?: ConceptKind;

  @ApiPropertyOptional({ default: true })
  @Transform(booleanQuery)
  @IsBoolean()
  isActive = true;
}

export class ConceptResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ enum: ConceptKind }) kind!: ConceptKind;
  @ApiProperty({ nullable: true, type: String }) sku!: string | null;
  @ApiProperty() name!: string;
  @ApiProperty({ nullable: true, type: String }) description!: string | null;
  @ApiProperty({ type: MeasurementUnitResponseDto }) unit!: MeasurementUnitResponseDto;
  @ApiProperty({ description: 'Decimal entregado como texto' }) cost!: string;
  @ApiProperty({ description: 'Decimal entregado como texto' }) price!: string;
  @ApiProperty() tracksInventory!: boolean;
  @ApiProperty({ nullable: true, type: String }) satProductServiceCode!: string | null;
  @ApiProperty() isActive!: boolean;
  @ApiProperty({ format: 'uuid' }) createdByUserId!: string;
  @ApiProperty({ format: 'uuid' }) updatedByUserId!: string;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}

export class PaginatedConceptsResponseDto {
  @ApiProperty() page!: number;
  @ApiProperty() limit!: number;
  @ApiProperty() totalItems!: number;
  @ApiProperty() totalPages!: number;
  @ApiProperty() hasNextPage!: boolean;
  @ApiProperty({ type: ConceptResponseDto, isArray: true })
  items!: ConceptResponseDto[];
}
