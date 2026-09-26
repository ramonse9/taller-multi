import { ApiProperty } from "@nestjs/swagger";
import { EmisorResponseDto } from './emisor-response.dto';

export class EmisorAllDto{

    /*@ApiProperty({ type: [OrdenResponseDto], description: 'Listado de Órdenes'})
    ordenes: OrdenResponseDto[];*/

    @ApiProperty({ type: [EmisorResponseDto], description: 'Listado de Emisores'})
    emisores: EmisorResponseDto[];
}