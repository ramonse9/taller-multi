import { ApiProperty } from "@nestjs/swagger";

export class SatExportacionResponseDto{

    @ApiProperty({example: '01', description: 'Clave de Exportación'})
    clave: string;

    @ApiProperty({example: 'no aplica', description: 'Descripción de Exportación'})
    descripcion: string;
}