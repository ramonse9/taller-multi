import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsDecimal,
  IsNotEmpty,
  IsString,
  Matches,
} from 'class-validator';

export class CreateServicioDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  descripcion: string;

  @ApiProperty({ example: '500.00' })
  @IsNotEmpty()
  @IsDecimal({ decimal_digits: '0,2' })
  @Matches(/^(?!-)(\d+)(\.\d{1,2})?$/)
  precioVenta: string;

  @ApiProperty()
  @IsNotEmpty()
  @Transform(({ value }) => value?.toLowerCase())
  idSatProductoServicio: string;
}
