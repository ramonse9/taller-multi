import { ApiProperty } from "@nestjs/swagger"
import { Transform } from "class-transformer"
import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, MinLength, ValidateIf  } from "class-validator"

export class CreateClienteDto {

    @ApiProperty({ example: 'carlos', description: 'Nombre del Cliente'})
    @IsString({message: "Nombre no válido"})
    @IsNotEmpty({message:'El Nombre del Cliente no puede estar vacío'})
    @MinLength(3,{message:'El Nombre del Cliente debe tener al menos 3 caracteres'})
    @MaxLength(50,{message:'El Nombre del Cliente no puede tener mas de 50 caracteres'})
    @Transform( ({ value }) => value?.toLowerCase() )
    nombre: string    

    @ApiProperty({ example: '6677112233', description: 'Teléfono de 10 dígitos'})
    @IsNotEmpty({message:'El número de teléfono no puede estar vacío'})
    @Matches(/^\d{10}$/, { message: 'El número de teléfono debe tener exactamente 10 dígitos.' })
    telefono: string

    @ApiProperty({ example: 'cliente@gmail.com', description: 'Correo electrónico del Cliente', required: false, nullable: true})
    @ValidateIf( ({ email }) => email !== '' && email !== null && email !== undefined  )
    @IsOptional()
    @IsString({message: "Email no válido"})    
    @IsEmail( {}, { message: "Debes de agregar un Email válido"})
    @MaxLength(40,{message:'El Email no debe de tener mas de 40 caracteres'})
    @Transform( ({value}) => value?.toLowerCase() )
    email?: string
    
    @ApiProperty({ example: 'ABCD800101XYZ', description: 'RFC', required: false, nullable: true})
    @IsOptional()
    @IsString({message: "RFC no válido"})    
    @MaxLength(13,{message:'El RFC no debe de tener mas de 13 caracteres'})
    @Transform( ({value}) => value?.toLowerCase() )
    rfc?: string
    
    @ApiProperty({ example: 'Comercializadora  Ejemplo S.A. de C.V.', description: 'Razón Social', required: false, nullable: true})
    @IsOptional()
    @IsString()
    razonSocial?: string;

    @ApiProperty({example: '626', description: 'Clave del Regimen Fiscal', required: false, nullable: true})
    @IsOptional()
    @IsString()
    claveSatRegimenFiscal?: string    
    
    @ApiProperty({example: 'G01', description: 'Clave del Uso CFDI', required: false, nullable: true})
    @IsOptional()
    @IsString()     
    claveSatUsoCFDI?: string    
    
    @ApiProperty({ example: '06400', description: 'c_CodigoPostal', required: false, nullable: true})
    @IsOptional()
    @IsString()
    codigoPostal?: string;
}

//@ApiProperty({ example: '601 - General de Ley Personas Morales', description: 'c_RegimenFiscal'})
//@IsNumber()
//regimenFiscal?: number;

//@IsNotEmpty({message: 'Debe de incluir un producto ó servicio'})

//@ApiProperty({ example: 'G03 - Gastos en general', description: 'c_UsoCFDI'})    
//@IsString()
//usoCFDI?: string;