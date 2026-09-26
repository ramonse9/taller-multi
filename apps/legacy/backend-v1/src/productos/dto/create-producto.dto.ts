import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDecimal,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Min,
} from 'class-validator';

export class CreateProductoDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  descripcion: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  codigoBarras?: string;

  @ApiProperty({ example: '100.00' })
  @IsNotEmpty()
  @IsDecimal({ decimal_digits: '0,2' })  
  precioVenta: number;

  @ApiProperty({ required: false, example: '0' })
  @IsOptional()
  @IsInt()
  @Min(0)
  stockMinimo?: number;

  /*@ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  manejaInventario?: boolean;*/

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  @IsBoolean()
  permiteVentaSinStock?: boolean;

  @ApiProperty()
  @IsNotEmpty()
  @Transform(({ value }) => value?.toLowerCase())
  idSatProductoServicio: string;
}
