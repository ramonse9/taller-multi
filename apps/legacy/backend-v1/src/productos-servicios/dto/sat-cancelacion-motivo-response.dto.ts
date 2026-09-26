import { ApiProperty } from "@nestjs/swagger";

export class SatCancelacionMotivoResponseDto {

    @ApiProperty({example: '01', description: 'Clave del Motivo de Cancelación'})
    clave: string;

    @ApiProperty({example: 'No se llevó acabo la operación', description: 'Descripción del Motivo de Cancelación'})
    descripcion: string;
}