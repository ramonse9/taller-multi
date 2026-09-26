import { EnumTipoPagoGasto } from '../../commom/enums/general.enum';
import { ApiProperty } from '@nestjs/swagger';
import { GastoResponseDto } from './gasto-response.dto';
import { Type } from 'class-transformer';

export class GastoMovimientoResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  monto: number;

  @ApiProperty()
  fecha: string;

  @ApiProperty({example: 'proceso', description: 'Estatus de la Orden'})
  tipoPago: EnumTipoPagoGasto;

  @ApiProperty({type: () => GastoResponseDto, description: 'Gasto'})
  @Type( () => GastoResponseDto)
  gasto: GastoResponseDto;

  @ApiProperty()
  referencia?: string;

  @ApiProperty({example: '2025-04-18 20:14:44.933942+00' })
  updatedAt: string

  @ApiProperty({example: '2025-04-18 20:14:44.933942+00' })
  createdAt: string
}

export class ResumenMensualDto {
  @ApiProperty()
  mes: number;

  @ApiProperty()
  anio: number;

  @ApiProperty()
  totalGastos: number;

  @ApiProperty({ type: [GastoResponseDto] })
  gastos: GastoResponseDto[];
}