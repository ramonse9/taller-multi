import { IsIn, IsString } from "class-validator";
import { PaginationQueryDto } from "../../DTOs/pagination/pagination-query.dto";

export class TipoPersonaPaginationQueryDto extends PaginationQueryDto{
    @IsString()
    @IsIn(['fisica','moral'])
    tipoPersona: string;

}