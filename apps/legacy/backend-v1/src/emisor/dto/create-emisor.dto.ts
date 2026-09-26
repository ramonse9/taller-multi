import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";
import { ToUpperCase } from "../decorators/to-upper-case.decorator";

export class CreateEmisorDto {

    @ApiProperty({ example: 'ABCD800101XYZ', description: 'RFC'})
    @IsNotEmpty()
    @IsString()
    @ToUpperCase()
    rfc: string;

    @ApiProperty({ example: 'Comercializadora  Ejemplo S.A. de C.V.', description: 'Razón Social'})
    @IsNotEmpty()
    @IsString()
    @ToUpperCase()
    razonSocial: string;
    
    @ApiProperty({ example: '601 - General de Ley Personas Morales', description: 'c_RegimenFiscal'})
    @IsNotEmpty()
    @IsString()
    claveSatRegimenFiscal: string;
    
    @ApiProperty({ example: '06400', description: 'c_CodigoPostal'})
    @IsNotEmpty()
    @IsString()
    codigoPostal: string;    
}
