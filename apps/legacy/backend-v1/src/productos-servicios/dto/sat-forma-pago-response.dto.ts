import { ApiProperty } from "@nestjs/swagger";

export class SatFormaPagoResponseDto {

    @ApiProperty({example: '01', description: 'Clave de la Forma Pago'})
    clave: string;

    @ApiProperty({example: 'Efectivo', description: 'Descripción de la Forma Pago'})
    descripcion: string;
}