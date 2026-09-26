import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  Max,
  Min,
} from 'class-validator';

const trimNullableString = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() || null : value;

const normalizeNullableEmail = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim().toLowerCase() || null : value;

const normalizeNullableTaxId = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim().toUpperCase() || null : value;

export class CreateClientDto {
  @ApiProperty({ example: 'Ana López' })
  @Transform(trimNullableString)
  @IsString()
  @Length(2, 180)
  fullName!: string;

  @ApiPropertyOptional({ nullable: true, format: 'uuid' })
  @IsOptional()
  @IsUUID()
  corporateCustomerId?: string | null;

  @ApiPropertyOptional({ example: 'LOPA900101AB1', nullable: true })
  @Transform(normalizeNullableTaxId)
  @IsOptional()
  @IsString()
  @Matches(/^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/, { message: 'taxId debe ser un RFC válido' })
  taxId?: string | null;

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

export class ClientResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() fullName!: string;
  @ApiProperty({ nullable: true, type: String }) corporateCustomerId!: string | null;
  @ApiProperty({ nullable: true, type: String }) taxId!: string | null;
  @ApiProperty({ nullable: true, type: String }) email!: string | null;
  @ApiProperty({ nullable: true, type: String }) phone!: string | null;
  @ApiProperty({ nullable: true, type: String }) notes!: string | null;
  @ApiProperty() isActive!: boolean;
  @ApiProperty({ format: 'uuid' }) createdByUserId!: string;
  @ApiProperty({ format: 'uuid' }) updatedByUserId!: string;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}

export class PaginatedClientsResponseDto {
  @ApiProperty() page!: number;
  @ApiProperty() limit!: number;
  @ApiProperty() totalItems!: number;
  @ApiProperty() totalPages!: number;
  @ApiProperty() hasNextPage!: boolean;
  @ApiProperty({ type: ClientResponseDto, isArray: true }) items!: ClientResponseDto[];
}

export class ClientsTotalResponseDto {
  @ApiProperty() total!: number;
}
