import { ApiProperty } from "@nestjs/swagger";
import { CountResponseDto } from "../../DTOs/count/count-response.dto";
import { MarcaResponseDto } from "./marca-response.dto";

export class MarcaAllResponseDto extends CountResponseDto{

    @ApiProperty({description: 'Listado de Marcas', type: [MarcaResponseDto]})
    marcas: MarcaResponseDto[]

}