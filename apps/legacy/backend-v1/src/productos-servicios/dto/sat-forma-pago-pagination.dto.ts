import { ApiProperty } from "@nestjs/swagger";
import { PaginationResponseDto } from "../../DTOs/pagination/pagination-response.dto";
import { SatFormaPagoResponseDto } from "./sat-forma-pago-response.dto";
import { Type } from "class-transformer";

export class SatFormaPagoPaginationDto extends PaginationResponseDto{

    @ApiProperty({type: [SatFormaPagoResponseDto], description: 'Listado de Formas Pagos'})
    @Type( () => SatFormaPagoResponseDto )
    satFormasPagos: SatFormaPagoResponseDto[];    

}