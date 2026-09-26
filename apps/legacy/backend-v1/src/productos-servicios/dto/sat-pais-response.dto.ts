import { ApiProperty } from "@nestjs/swagger";

export class SatPaisResponseDto {

    @ApiProperty({example: '01', description: 'Clave del País'})
    clave: string;

    @ApiProperty({example: 'México', description: 'Descripción del País'})
    descripcion: string;
}