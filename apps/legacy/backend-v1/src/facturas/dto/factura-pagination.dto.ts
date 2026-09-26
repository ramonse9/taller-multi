import { ApiProperty } from "@nestjs/swagger";
import { PaginationResponseDto } from "../../DTOs/pagination/pagination-response.dto";
import { FacturaResponseDto } from './factura-response.dto';

export class FacturaPaginationDto extends PaginationResponseDto{
    
    @ApiProperty({type: [FacturaResponseDto], description: 'Listado de Facturas'})
    facturas: FacturaResponseDto[]

}