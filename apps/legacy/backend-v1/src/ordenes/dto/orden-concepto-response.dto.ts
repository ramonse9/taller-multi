import { ProductoServicioResponseDto } from './../../productos-servicios/dto/producto-servicio-response.dto';
import { ApiProperty } from "@nestjs/swagger";
import { Type } from 'class-transformer';

//export class OrdenResponseDto extends OmitType( PartialType ( CreateOrdenDto), ['id_vehiculo', 'id_cliente', 'id_empresa'] as const){

export class OrdenConceptoResponseDto{

    @ApiProperty({example: '123', description: 'ID consecutivo para el concepto'})
    id: number

    @ApiProperty()
    cantidad: number;

    /*@ApiProperty({    
        example: '1000.00',
        description: 'Valor unitario como string con formato decimal (ej. "1000.00")',
        type: String
    })
    valorUnitario: string;*/

    @ApiProperty({    
        example: 1000,
        description: 'Valor unitario con formato decimal',
        type: Number
    })
    valorUnitario: number;
    
    @ApiProperty({ type: () => ProductoServicioResponseDto, description: 'Producto ó Servicio'})
    @Type( () => ProductoServicioResponseDto )
    productoServicio: ProductoServicioResponseDto;
}

//@ApiProperty({ type: () => [OrdenConceptoResponseDto], description: 'Conceptos asociados a la Orden'})
//conceptos: OrdenConcepto[]
//@ApiProperty({ example: '2025-01-01T12:00:00Z' })
//createdAt: Date;