import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsDecimal,
  IsNotEmpty,
  IsNumber,
  IsString,
  Matches,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCompraDetalleDto {
  @ApiProperty()
  @IsNotEmpty()
  @Transform(({ value }) => value?.toLowerCase())
  id_producto: string;

  @ApiProperty({ example: 10 })
  @Type(() => Number)
  @IsNumber()
  @Min(0.001)
  cantidad: number;

  @ApiProperty({ example: '50.00' })
  @IsNotEmpty()
  @IsDecimal({ decimal_digits: '0,2' })
  @Matches(/^(?!-)(\d+)(\.\d{1,2})?$/)
  costoUnitario: string;
}
