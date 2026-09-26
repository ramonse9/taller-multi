import { ApiProperty } from "@nestjs/swagger"
import { Transform } from "class-transformer"
import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, MinLength } from "class-validator"

export class CreateEmpresaDto {

    @ApiProperty({ example: 'Qualitas', description: 'Nombre de la Empresa'})
    @IsString({message: "Nombre no válido"})
    @IsNotEmpty({message:'El Nombre de la Empresa no puede estar vacío'})
    @MinLength(3,{message:'El Nombre de la Empresa debe tener al menos 3 caracteres'})
    @MaxLength(70,{message:'El Nombre de la Empresa no puede tener mas de 70 caracteres'})
    @Transform( ({value}) => value?.toLowerCase())
    nombre: string    

    @ApiProperty({ example: '6677112233', description: 'Teléfono de 10 dígitos'})
    @IsNotEmpty({message:'El número de teléfono no puede estar vacío'})
    @Matches(/^\d{10}$/, { message: 'El número de teléfono debe tener exactamente 10 dígitos.' })
    telefono: string

    @ApiProperty({ example: 'contacto@empresa.com', description: 'Correo electrónico de la Empresa', required: false})
    @IsString({message: "Email no válido"})
    @IsNotEmpty({message:'El Email no puede estar vacío'})
    @IsEmail( {}, { message: "Debes de agregar un Email válido"})
    @MaxLength(40,{message:'El Email no debe de tener mas de 40 caracteres'})
    @Transform(({value}) => value?.toLowerCase())
    email?: string
    
    @ApiProperty({ example: 'ABCD800101XYZ', description: 'RFC', nullable: true})
    @IsString({message: "RFC no válido"})    
    @IsOptional()
    @MaxLength(13,{message:'El RFC no debe de tener mas de 13 caracteres'})
    @Transform( ({value}) => value?.toLowerCase() )
    rfc?: string
    
    @ApiProperty({ example: 'Comercializadora  Ejemplo S.A. de C.V.', description: 'Razón Social', required: false})
    @IsString()
    @IsOptional()
    razonSocial?: string;

    @ApiProperty({example: '626', description: 'Clave del Regimen Fiscal', required: false})
    @IsString()
    @IsOptional()
    claveSatRegimenFiscal?: string    
    
    @ApiProperty({example: 'G01', description: 'Clave del Uso CFDI', required: false})
    @IsString()
    @IsOptional()
    claveSatUsoCFDI?: string    
    
    @ApiProperty({ example: '06400', description: 'c_CodigoPostal', required: false})
    @IsString()
    @IsOptional()
    codigoPostal?: string;

}
