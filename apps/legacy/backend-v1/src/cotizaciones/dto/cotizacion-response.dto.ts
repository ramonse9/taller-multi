import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { ClienteResponseDto } from "./../../clientes/dto/cliente-response.dto";
import { EmpresaResponseDto } from "./../../empresas/dto/empresa-response.dto";
import { VehiculoResponseDto } from "./../../vehiculos/dto/vehiculo-response.dto";
import { CotizacionConceptoResponseDto } from "./cotizacion-concepto-response.dto";

export class CotizacionResponseDto {
    @ApiProperty({example: 'COT000123', description: 'ID de la Cotizacion'})
    id: string;

    @ApiProperty({ type: () => VehiculoResponseDto, description: 'Vehículo asociado a la Cotizacion' })
    @Type( () => VehiculoResponseDto)
    vehiculo?: VehiculoResponseDto    

    @ApiProperty({ type: () => ClienteResponseDto, description: 'Cliente asociado a la Cotizacion' })
    @Type( () => ClienteResponseDto )
    cliente?: ClienteResponseDto;    

    @ApiProperty({ type: () => EmpresaResponseDto, description: 'Empresa asociada a la Cotizacion'})
    @Type( () => EmpresaResponseDto )
    empresa?: EmpresaResponseDto;    

    @ApiProperty({ type: () => [CotizacionConceptoResponseDto], description: 'Conceptos asociados a la Cotizacion'})
    @Type(() => CotizacionConceptoResponseDto)
    conceptos: CotizacionConceptoResponseDto[]

    @ApiProperty({example: '2025-04-18 20:14:44.933942+00' })
    updatedAt: string

    @ApiProperty({example: '2025-04-18 20:14:44.933942+00' })
    createdAt: string
   
}