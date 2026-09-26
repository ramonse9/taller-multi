
import { ApiProperty } from "@nestjs/swagger";

export class SatTipoProductoServicioResponseDto{
    
    @ApiProperty({example: 'producto', description: 'Indica si es Producto ó Servicio'})
    tipo: string;

}