import { ApiProperty } from "@nestjs/swagger";

export class CompraDetalleResponseDto{

    @ApiProperty({example: 'COD000123', description:'ID del Detalle de la Compra'})
    id: number;

    

}