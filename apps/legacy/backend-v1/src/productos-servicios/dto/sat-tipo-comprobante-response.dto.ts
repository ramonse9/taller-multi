import { ApiProperty } from "@nestjs/swagger";

export class SatTipoComprobanteResponseDto {

    @ApiProperty({example: 'I', description: 'Clave del Tipo De Comprobante'})
    clave: string;

    @ApiProperty({example: 'Ingreso', description: 'Descripción del Tipo De Comprobante'})
    descripcion: string;
}