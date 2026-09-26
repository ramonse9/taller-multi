import { CreateOrdenDto } from "./create-orden.dto";
import { ApiProperty, OmitType, PartialType } from "@nestjs/swagger";
import { ClienteResponseDto } from "../../clientes/dto/cliente-response.dto";
import { EmpresaResponseDto } from "../../empresas/dto/empresa-response.dto";
import { VehiculoResponseDto } from "../../vehiculos/dto/vehiculo-response.dto";
import { OrdenNotaResponseDto } from "./orden-nota-response.dto";
import { OrdenConceptoResponseDto } from "./orden-concepto-response.dto";
import { Type } from "class-transformer";

export class OrdenResponseDto extends OmitType( PartialType ( CreateOrdenDto), ['id_vehiculo', 'id_cliente', 'id_empresa', 'conceptos'] as const){

    @ApiProperty({example: 'ORD000123', description: 'ID de la Orden'})
    id: string;

    @ApiProperty({example: 'true', description: 'Indica si la orden está pagada'})
    pagada: boolean;

    @ApiProperty({example: 'true', description: 'Indica si la factura de esta orden está liquidada'})
    liquidacionFactura: boolean;

    @ApiProperty({example: 'Cambio de aceite', description: 'Indica de manera general el objetivo de la Orden'})
    descripcion: string;

    @ApiProperty({example: '2025-04-18 20:14:44.933942+00', description: 'Fecha de ingreso en formato ISO (UTC)' })
    fechaIngreso: string;

    @ApiProperty({example: '2025-04-18 20:14:44.933942+00', description: 'Fecha Entrega Real en formato ISO (UTC)' })
    fechaEntregaReal?: string;

    @ApiProperty({example: '2025-04-18 20:14:44.933942+00', description: 'Fecha de pago en formato ISO (UTC)' })
    fechaPago: string;

    @ApiProperty({example: '20000', description: 'Kilometraje del auto'})
    kilometros?: number;

    @ApiProperty({example: 'pol1234', description: 'Póliza de la Orden (opcional)'})
    poliza?: string;

    @ApiProperty({example: '123456', description: 'Siniestro de la Orden (opcional)'})
    siniestro?: string;

    @ApiProperty({example: 'proceso', description: 'Situación de la Orden'})
    estatus: string;

    @ApiProperty({example: 'pendiente', description: 'Situación de la Facturación'})
    estatusFactura: string;

    @ApiProperty({example: '2025-04-18 20:14:44.933942+00', description: 'Fecha de liquidacion en formato ISO (UTC)' })
    fechaLiquidacion?: string;

    @ApiProperty({example: 'FOL123456', description: 'Folio Nota indicada por el cliente (opcional)'})
    folioNota?: string;

    @ApiProperty({ type: () => VehiculoResponseDto, description: 'Vehículo asociado a la Orden' })
    @Type( () => VehiculoResponseDto)
    vehiculo: VehiculoResponseDto    

    @ApiProperty({ type: () => ClienteResponseDto, description: 'Cliente asociado a la Orden' })
    @Type( () => ClienteResponseDto )
    cliente?: ClienteResponseDto;    

    @ApiProperty({ type: () => EmpresaResponseDto, description: 'Empresa asociada a la Orden'})
    @Type( () => EmpresaResponseDto )
    empresa?: EmpresaResponseDto;    

    @ApiProperty({ type: () => [OrdenNotaResponseDto], description: 'Notas asociadas a la Orden'})
    @Type( () => OrdenNotaResponseDto )
    notas: OrdenNotaResponseDto[]    
    
  
    @ApiProperty({ type: () => [OrdenConceptoResponseDto], description: 'Conceptos asociados a la Orden'})
    @Type(() => OrdenConceptoResponseDto)
    conceptos: OrdenConceptoResponseDto[]

    @ApiProperty({example: '2025-04-18 20:14:44.933942+00' })
    updatedAt: string

    @ApiProperty({example: '2025-04-18 20:14:44.933942+00' })
    createdAt: string
}

