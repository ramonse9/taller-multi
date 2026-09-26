import { ApiProperty } from "@nestjs/swagger";

export class SatUsoCFDIResponseDto {    

    @ApiProperty({example: 'G01', description: 'Clave del Uso CFDI'})
    clave: string;

    @ApiProperty({example: 'Adquisición de mercancías.', description: 'Descripción del Uso CFDI'})
    descripcion: string;

    @ApiProperty({example: true, description: 'Indica si aplica para personas físicas'})
    fisica: boolean;

    @ApiProperty({example: false, description: 'Indica si aplica para personas morales'})
    moral: boolean;
}