import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { ProductoServicioResponseDto } from "./../../productos-servicios/dto/producto-servicio-response.dto";

export class CotizacionConceptoResponseDto{
    @ApiProperty({example: '123', description: 'ID consecutivo para el concepto'})
    id: number;

    @ApiProperty()
    cantidad: number;

    @ApiProperty({
        example: 1000,
        description: 'Valor unitario con formato decimal',
        type: Number
    })
    valorUnitario: number;

    @ApiProperty({type: () => ProductoServicioResponseDto, description: 'Producto ó Servicio'})
    @Type( () => ProductoServicioResponseDto )
    productoServicio: ProductoServicioResponseDto;
}