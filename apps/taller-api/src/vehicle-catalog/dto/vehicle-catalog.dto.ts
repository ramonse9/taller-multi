import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, IsUUID, Length, Max, Min } from 'class-validator';

const trimName = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : value;

export class VehicleCatalogQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ default: 50, minimum: 1, maximum: 100 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 50;

  @ApiPropertyOptional({ default: '', maxLength: 100 })
  @Transform(trimName)
  @IsOptional()
  @IsString()
  @Length(0, 100)
  search = '';

  @ApiPropertyOptional({ default: true, type: Boolean })
  @Transform(({ value }: { value: unknown }) => {
    if (value === undefined || value === '') return true;
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @IsBoolean()
  isActive = true;
}

export class VehicleModelQueryDto extends VehicleCatalogQueryDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  brandId!: string;
}

export class CreateVehicleBrandDto {
  @ApiProperty({ example: 'Toyota', minLength: 2, maxLength: 100 })
  @Transform(trimName)
  @IsString()
  @Length(2, 100)
  name!: string;
}

export class UpdateVehicleBrandDto {
  @ApiPropertyOptional({ example: 'Toyota', minLength: 2, maxLength: 100 })
  @Transform(trimName)
  @IsOptional()
  @IsString()
  @Length(2, 100)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateVehicleModelDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  brandId!: string;

  @ApiProperty({ example: 'Corolla', minLength: 1, maxLength: 100 })
  @Transform(trimName)
  @IsString()
  @Length(1, 100)
  name!: string;
}

export class UpdateVehicleModelDto {
  @ApiPropertyOptional({ example: 'Corolla', minLength: 1, maxLength: 100 })
  @Transform(trimName)
  @IsOptional()
  @IsString()
  @Length(1, 100)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class VehicleBrandResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() isActive!: boolean;
  @ApiProperty({ format: 'uuid', nullable: true, type: String })
  createdByUserId!: string | null;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}

export class VehicleModelResponseDto extends VehicleBrandResponseDto {
  @ApiProperty({ format: 'uuid' }) brandId!: string;
  @ApiProperty() brandName!: string;
}

export class PaginatedVehicleBrandsDto {
  @ApiProperty() page!: number;
  @ApiProperty() limit!: number;
  @ApiProperty() totalItems!: number;
  @ApiProperty() totalPages!: number;
  @ApiProperty() hasNextPage!: boolean;
  @ApiProperty({ type: VehicleBrandResponseDto, isArray: true })
  items!: VehicleBrandResponseDto[];
}

export class PaginatedVehicleModelsDto {
  @ApiProperty() page!: number;
  @ApiProperty() limit!: number;
  @ApiProperty() totalItems!: number;
  @ApiProperty() totalPages!: number;
  @ApiProperty() hasNextPage!: boolean;
  @ApiProperty({ type: VehicleModelResponseDto, isArray: true })
  items!: VehicleModelResponseDto[];
}
