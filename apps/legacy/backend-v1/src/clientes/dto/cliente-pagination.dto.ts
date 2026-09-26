import { ApiProperty } from "@nestjs/swagger";
import { ClienteResponseDto } from "./cliente-response.dto";
import { PaginationResponseDto } from "../../DTOs/pagination/pagination-response.dto";
import { Type } from "class-transformer";

export class ClientePaginationDto extends PaginationResponseDto{

    @ApiProperty({type: [ClienteResponseDto], description: 'Listado de Clientes'})
    @Type( () => ClienteResponseDto )
    clientes: ClienteResponseDto[];

}