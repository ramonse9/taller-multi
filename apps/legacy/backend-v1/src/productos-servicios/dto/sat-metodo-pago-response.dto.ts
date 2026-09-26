import { ApiProperty } from "@nestjs/swagger";

export class SatMetodoPagoResponseDto {

    @ApiProperty({example: 'PUE', description: 'Clave del Método Pago'})
    clave: string;

    @ApiProperty({example: 'Pago en una sola exhibición', description: 'Descripción del Método Pago'})
    descripcion: string;
}