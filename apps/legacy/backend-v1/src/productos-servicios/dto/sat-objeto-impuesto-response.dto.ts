import { ApiProperty } from "@nestjs/swagger";

export class SatObjetoImpuestoResponseDto {
    
    @ApiProperty({example: 'La clave del Objeto Impuesto', description: 'Clave' })
    clave: string;

    @ApiProperty({example: 'La descripción del Objeto Impuesto', description: 'Descripción' })
    descripcion: string;
    
} 