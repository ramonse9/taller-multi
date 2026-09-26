import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { NominaPeriodoResponseDto } from "./nomina-periodo-response.dto";
import { EnumNominaMovimientoEstatus } from "./../../commom/enums/general.enum";
import { NominaMovimientoDetalleResponseDto } from "./nomina-movimiento-detalle-response.dto";
import { EmpleadoResponseDto } from "../../empleados/dto/empleado-response.dto";

export class NominaMovimientoResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  totalPercepciones: number;

  @ApiProperty()
  totalDeducciones: number;

  @ApiProperty()
  totalNeto: number;

  @ApiProperty()
  fecha: string;

  @ApiProperty({example: 'Activo', description: 'Estatus del Movimiento', enum: EnumNominaMovimientoEstatus})
  estatus: EnumNominaMovimientoEstatus;

  @ApiProperty()
  @Type( () => EmpleadoResponseDto )
  empleado: EmpleadoResponseDto;

  @ApiProperty()
  @Type( () => NominaPeriodoResponseDto )
  nominaPeriodo: NominaPeriodoResponseDto;

  @ApiProperty()
  @Type( () => NominaMovimientoDetalleResponseDto)
  nominaMovimientoDetalles: NominaMovimientoDetalleResponseDto[];

  @ApiProperty({example: '2025-04-18 20:14:44.933942+00' })
  updatedAt: string

  @ApiProperty({example: '2025-04-18 20:14:44.933942+00' })
  createdAt: string
}
