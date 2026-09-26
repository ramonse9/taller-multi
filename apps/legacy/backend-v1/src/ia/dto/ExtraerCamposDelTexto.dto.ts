import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";
import { EnumEntidadesVoice } from "../../commom/enums/general.enum";

export class ExtraerCamposDelTextoDto{

    @ApiProperty({example: 'Jetta Blanco año 2020' })
    @IsString()
    texto: string;

    @ApiProperty({example: 'vehiculo' })
    @IsString()
    entidad: EnumEntidadesVoice;

}