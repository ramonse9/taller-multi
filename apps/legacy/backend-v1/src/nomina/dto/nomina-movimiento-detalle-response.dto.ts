import { ApiProperty } from "@nestjs/swagger";
import { EnumNominaMovimientoTipo } from "./../../commom/enums/general.enum";
import { NominaMovimientoResponseDto } from "./nomina-movimiento-response.dto";

export class NominaMovimientoDetalleResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  concepto: number;
  
  @ApiProperty()
  monto: number;

  @ApiProperty({example: 'PERCEPCION', description: 'Tipo del Movimiento Detalle', enum: EnumNominaMovimientoTipo })
  tipo: EnumNominaMovimientoTipo;

  @ApiProperty()
  nominaMovimiento: NominaMovimientoResponseDto;

}
