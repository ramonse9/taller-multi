import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsInt, IsNotEmpty, IsOptional, IsString, Length, Max, MaxLength, Min} from "class-validator";

export class CreateVehiculoDto {

    @ApiProperty({example: '2020', description: 'Año del Vehículo'})
    @IsInt({message: "El año debe ser un número entero"})
    @IsNotEmpty({message: 'El año no puede estar vacío'})
    @Min(1900, {message: 'El año no puede ser menor a 1900'})
    @Max(new Date().getFullYear() + 1, {message: `El año no puede ser mayor a ${ new Date().getFullYear() + 1 }`})
    @Transform( ({value}) => Number(value))
    anio: number
    
    @ApiProperty({example: 'Rojo', description: 'Color del Vehículo'})
    @IsString()
    @MaxLength(20, {message: 'El color no puede tener más de 20 caracteres'})
    @Transform( ({value}) => value?.toLowerCase() ) 
    color: string
    
    @ApiProperty({example: 'VPU-872-C', description: 'Placa del Vehículo'})
    @IsOptional()
    @IsString()
    @MaxLength(15, {message: 'La placa no puede tener más de 15 caracteres'})
    @Transform( ({value}) => value?.toLowerCase() ) 
    placa?: string
        
    @ApiProperty({example: '1HGBH41JXMN109186', description: 'Número de Serie del Vehículo'})
    @IsString()
    @IsNotEmpty({message: 'El Número de Serie es obligatorio'})
    @Length(10,10, {message: 'El Número de Serie debe tener 10 caracteres'})
    @Transform( ({value}) => value?.toLowerCase() ) 
    numeroSerie:string
    
    @ApiProperty({ example: 'MOD000123', description: 'Modelo del Vehículo'})
    @IsNotEmpty({message: 'El modelo no puede estar vacío'})
    @IsString()
    @Length(9,9, {message: 'La clave de modelo debe ser de 9 caracteres'})
    @Transform( ({value}) => value?.toLowerCase() ) 
    id_modelo: string
}