import { ApiProperty } from "@nestjs/swagger";

export class SatRegimenFiscalResponseDto {

    @ApiProperty({example: 626, description: 'Clave del Régimen Fiscal'})
    clave: string;

    @ApiProperty({example: 'Régimen Simplificado de Confianza', description: 'Descripción del Régimen Fiscal'})
    descripcion: string;

    @ApiProperty({example: true, description: 'Indica si aplica para personas físicas'})
    fisica: boolean;

    @ApiProperty({example: false, description: 'Indica si aplica para personas morales'})
    moral: boolean;
}