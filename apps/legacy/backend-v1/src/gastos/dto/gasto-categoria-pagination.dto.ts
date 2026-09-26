import { ApiProperty } from "@nestjs/swagger";
import { PaginationResponseDto } from "../../DTOs/pagination/pagination-response.dto";
import { Type } from "class-transformer";
import { GastoCategoriaResponseDto } from "./gasto-categoria-response.dto";

export class GastoCategoriaPaginationDto extends PaginationResponseDto{

    @ApiProperty({ type: [GastoCategoriaResponseDto], description: 'Listado de Categorías de Gastos'})
    @Type( () => GastoCategoriaResponseDto )
    gastosCategorias: GastoCategoriaResponseDto[];
    
}