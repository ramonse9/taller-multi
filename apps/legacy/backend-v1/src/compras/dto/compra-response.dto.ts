import { ApiProperty, OmitType, PartialType } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { ProveedorResponseDto } from "../../proveedores/dto/proveedor-response.dto";
import { UserResponseDto } from "../../auth/dto/user-response.dto";
import { CompraDetalleResponseDto } from "./compra-detalle-response.dto";
//import { CreateCompraDto } from "./create-compra.dto";

export class CompraResponseDto{

    @ApiProperty({example: 'ORD000123', description: 'ID de la Orden'})
    id: string;
    
    @ApiProperty({example: 'FOLIO123', description: 'Folio de la Compra'})
    folio: string;

    @ApiProperty({ type: () => ProveedorResponseDto, description: 'Proveedor de la Compra' })
    @Type( () => ProveedorResponseDto)
    proveedor: ProveedorResponseDto

    @ApiProperty({example: '20000', description: 'Subtotal de la Compra'})
    subtotal: number;

    @ApiProperty({example: '3200', description: 'IVA de la Compra'})
    iva: number;
    
    @ApiProperty({example: '23200', description: 'Total de la Compra'})
    total: number;
    
    /*
    @ApiProperty({example: 'Observaciones...', description: 'Observaciones'})
    observaciones: string;
    */
    
    @ApiProperty({example: 'borrador', description: 'Estatus de la Compra'})
    estatus: string;

    @ApiProperty({example: 'Usuario Borrador', description: 'Usuario de la confirmacion de la compra' })
    usuarioBorrador: UserResponseDto;

    @ApiProperty({example: '2025-04-18 20:14:44.933942+00', description: 'Fecha de confirmacion de la compra en formato ISO (UTC)' })
    fechaConfirmacion: string;
    
    @ApiProperty({example: 'Usuario Confirmación', description: 'Usuario de la confirmacion de la compra' })
    usuarioConfirmacion: UserResponseDto;

    @ApiProperty({example: '2025-04-18 20:14:44.933942+00', description: 'Fecha de cancelacion de la compra en formato ISO (UTC)' })
    fechaCancelacion: string;

    @ApiProperty({example: 'Usuario Cancelación', description: 'Usuario de la cancelacion de la compra' })
    usuarioCancelacion: UserResponseDto;

    @ApiProperty({example: 'Motivo...', description: 'Motivo de la cancelación de la compra'})
    motivoCancelacion: string;

    @ApiProperty({ type: () => [CompraDetalleResponseDto], description: 'Detalles de la Compra'})
    @Type( () => CompraDetalleResponseDto )
    detalles: CompraDetalleResponseDto[];

    @ApiProperty({example: '2025-04-18 20:14:44.933942+00' })
    createdAt: string
}

