import { EnumTipoPagoGasto } from '../../commom/enums/general.enum';
import { IsString, IsDateString, IsEnum, IsOptional, IsNotEmpty, IsDecimal, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateGastoMovimientoDto {

  @ApiProperty({ example: '150.75', description: 'Monto del gasto' })
  @IsNotEmpty({ message: 'El monto es obligatorio para cada gasto.' })
  @IsDecimal({ decimal_digits: '0,2' }, { message: 'El monto del gasto solo puede tener máximo 2 decimales' })
  @Matches(/^(?!-)(\d+)(\.\d{1,2})?$/, {
      message: 'El monto del gasto no puede ser negativo y debe tener máximo 2 decimales',
  })
  monto: string;

  @ApiProperty({ example: '2026-02-23T12:00:00Z', description: 'Fecha del gasto' })
  @IsDateString()
  fecha: string;

  @ApiProperty({ enum: EnumTipoPagoGasto, example: EnumTipoPagoGasto.CONTADO, description: 'Tipo de pago del gasto' })
  @IsEnum(EnumTipoPagoGasto, {message: 'Tipo Pago del Gasto'})    
  tipoPago: EnumTipoPagoGasto;

  @ApiProperty({ example: 'REF000123', description: 'Referencia del gasto' })
  @IsOptional()
  referencia?: string;

  @ApiProperty({ example: 'GAC000001', description: 'ID del gasto concepto' })
  @IsNotEmpty({ message: 'El ID del gasto concepto es obligatorio.' })
  @IsString({ message: 'El ID del gasto concepto debe ser una cadena de texto.' })
  id_gasto: string;

}