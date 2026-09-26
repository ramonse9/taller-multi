import { ApiProperty } from '@nestjs/swagger';
import { GastoMovimientoResponseDto } from './gasto-movimiento-response.dto';

export class GastoConMovimientosResponseDto extends GastoMovimientoResponseDto {

  @ApiProperty({ type: [GastoMovimientoResponseDto] })
  gastosMovimientos: GastoMovimientoResponseDto[];

  @ApiProperty({ example: 1500.50 })
  totalGastado: number;

}