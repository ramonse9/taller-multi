import { ApiProperty } from "@nestjs/swagger";

export class SatImpuestoPorcentajeResponseDto {

    @ApiProperty({example: 'IVA_RATE', description: 'Clave del Impuesto'})
    clave: string;

    @ApiProperty({example: 'Impuesto al Valor Agregado (IVA) 16%', description: 'Descripción del Impuesto'})
    descripcion: string;

    @ApiProperty({example: '0.160000', description: 'Porcentaje de Impuesto'})
    tasa: string;

    @ApiProperty({example: 'TRASLADO', description: 'Tipo de Impuesto'})
    tipo: string;

    @ApiProperty({example: 'SUMA', description: 'Operación del Impuesto'})
    operacion: string;
    
}