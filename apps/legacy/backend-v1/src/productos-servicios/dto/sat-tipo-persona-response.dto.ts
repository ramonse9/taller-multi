import { ApiProperty } from "@nestjs/swagger";

export class SatTipoPersonaResponseDto {

    @ApiProperty({example: 'moral', description: 'Tipo de Persona'})
    tipo: string;

    @ApiProperty({example: 'true', description: 'Indica si hace Retenciones'})
    retenciones: boolean;
}