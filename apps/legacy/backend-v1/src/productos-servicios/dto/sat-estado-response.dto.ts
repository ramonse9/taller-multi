import { ApiProperty } from "@nestjs/swagger";

export class SatEstadoResponseDto {

    @ApiProperty({example: '01', description: 'Clave del Estado'})
    clave: string;

    @ApiProperty({example: 'Sinaloa', description: 'Descripción del Estado'})
    descripcion: string;

}