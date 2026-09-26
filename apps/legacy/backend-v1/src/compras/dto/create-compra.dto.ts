import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  ArrayMinSize,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { CreateCompraDetalleDto } from './create-compra-detalle.dto';

export class CreateCompraDto {
  /*@ApiProperty()
  @IsNotEmpty()
  @IsString()
  folio: string;*/

  @ApiProperty()
  @IsNotEmpty()
  @Transform(({ value }) => value?.toLowerCase())
  id_proveedor: string;

  /*
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  observaciones?: string;
  */

  @ApiProperty({ type: [CreateCompraDetalleDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateCompraDetalleDto)
  detalles: CreateCompraDetalleDto[];
}
