import { ApiProperty } from "@nestjs/swagger";
import { PaginationResponseDto } from "../../DTOs/pagination/pagination-response.dto";
import { SatMetodoPagoResponseDto } from "./sat-metodo-pago-response.dto";
import { Type } from "class-transformer";

export class SatMetodoPagoPaginationDto extends PaginationResponseDto{

    @ApiProperty({type: [SatMetodoPagoResponseDto], description: 'Listado de Metodos Pagos'})
    @Type( () => SatMetodoPagoResponseDto )
    satMetodosPagos: SatMetodoPagoResponseDto[];

}