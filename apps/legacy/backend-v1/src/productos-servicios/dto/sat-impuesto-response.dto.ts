import { ApiProperty } from "@nestjs/swagger";

export class SatImpuestoResponseDto {

    @ApiProperty({example: 'IVA_RATE', description: 'Clave del Impuesto'})
    clave: string;

    @ApiProperty({example: 'Impuesto al Valor Agregado (IVA) 16%', description: 'Descripción del Impuesto'})
    descripcion: string;

    @ApiProperty({example: true, description: 'Indica si aplica para personas físicas'})
    retencion: boolean;

    @ApiProperty({example: false, description: 'Indica si aplica para personas morales'})
    traslado: boolean;
}