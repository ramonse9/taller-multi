import { ApiProperty, OmitType, PartialType } from "@nestjs/swagger";
import { CreateModeloDto } from "./create-modelo.dto";
import { MarcaResponseDto } from "../../marcas/dto/marca-response.dto";
import { Type } from "class-transformer";

export class ModeloResponseDto extends OmitType( PartialType( CreateModeloDto ), ['id_marca'] as const ){//@follow-up

    @ApiProperty({example: 'MOD000123', description: 'ID del Modelo'})
    id: string

    @ApiProperty({type: () => MarcaResponseDto, description: 'Marca asociada al Modelo'})    
    @Type( () => MarcaResponseDto )
    marca: MarcaResponseDto
    //marca: Marca
}