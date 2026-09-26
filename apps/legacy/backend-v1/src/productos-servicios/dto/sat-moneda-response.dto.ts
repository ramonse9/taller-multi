import { ApiProperty } from "@nestjs/swagger";

export class SatMonedaResponseDto {

    @ApiProperty({example: 'MXN', description: 'Clave de la  Moneda'})
    clave: number;

    @ApiProperty({example: 'Peso Mexicano', description: 'Descripción de la Moneda'})
    descripcion: string;
}