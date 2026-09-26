import { ApiProperty } from "@nestjs/swagger";
import { SatProductoServicioResponseDto } from "./sat-producto-servicio-response.dto";
import { Type } from "class-transformer";

//export class ProductoServicioResponseDto extends OmitType( PartialType ( CreateProductoServicioDto ), ['idSatProductoServicio'] as const){
export class ProductoServicioResponseDto {

    @ApiProperty({example: 'PRO123', description: 'ID del Producto ó Servicio'})
    id: string;
    
    @ApiProperty()
    descripcion: string; 

    @ApiProperty({    
        example: 1000.12,
        description: 'Valor unitario con formato decimal',
        type: Number
    })
    valorUnitario: number;
    
    @ApiProperty({ type: () =>  SatProductoServicioResponseDto, description: 'Producto ó Servicio del catálogo' })
    @Type( () => SatProductoServicioResponseDto)
    satProductoServicio: SatProductoServicioResponseDto;

    @ApiProperty({example: '2025-04-18 20:14:44.933942+00' })
    updatedAt: Date

    @ApiProperty({example: '2025-04-18 20:14:44.933942+00' })
    createdAt: Date

}