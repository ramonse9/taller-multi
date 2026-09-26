import { ProductoServicioResponseDto } from './../../productos-servicios/dto/producto-servicio-response.dto';
import { ApiProperty, OmitType, PartialType } from "@nestjs/swagger";
import { Type } from 'class-transformer';

//export class OrdenResponseDto extends OmitType( PartialType ( CreateOrdenDto), ['id_vehiculo', 'id_cliente', 'id_empresa'] as const){

export class FacturaConceptoResponseDto{

    @ApiProperty({example: '123', description: 'ID consecutivo para el concepto'})
    id: number

    @ApiProperty()
    cantidad: number;

    @ApiProperty({    
        example: 1000,
        description: 'Valor unitario con formato decimal',
        type: Number
    })
    valorUnitario: number;

    @ApiProperty({    
        example: 1000,
        description: 'Subtotal con formato decimal',
        type: Number
    })
    subtotal: number;

    @ApiProperty({    
        example: 1000,
        description: 'Descuento con formato decimal',
        type: Number
    })
    descuento: number;

    @ApiProperty({    
        example: 1000,
        description: 'Importe con formato decimal',
        type: Number
    })
    importe: number;
    
    @ApiProperty({ type: () => ProductoServicioResponseDto, description: 'Producto ó Servicio'})
    @Type( () => ProductoServicioResponseDto )
    productoServicio: ProductoServicioResponseDto;

    //@ApiProperty({ type: () => ProductoServicioResponseDto, description: 'Producto ó Servicio'})
    //@Type( () => ProductoServicioResponseDto )
    //factura: FacturaResponseDto;

}

                                //@ApiProperty({ type: () => [OrdenConceptoResponseDto], description: 'Conceptos asociados a la Orden'})
                                //conceptos: OrdenConcepto[]
                                //@ApiProperty({ example: '2025-01-01T12:00:00Z' })
                                //createdAt: Date;