import { CreateCotizacionConceptoDto } from './create-cotizacion-concepto.dto';
import { CreateOrdenConceptoDto } from './../../ordenes/dto/create-orden-concepto.dto';
import { ApiProperty } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import { IsArray, IsInt, IsNotEmpty, IsOptional, IsString, Length, Max, Min, ValidateNested } from "class-validator";

export class CreateCotizacionDto {
    
    @ApiProperty({example: 'Descripción breve de lo que se hará en esta Cotizacion', description: 'Descripción de la Cotizacion'})
    @IsString({message: 'La descripcion debe ser una texto'})
    @IsNotEmpty({message: 'La descripcion es obligatoria'})
    descripcion: string;

    @ApiProperty({
        type: CreateOrdenConceptoDto, 
        description: 'Listado de conceptos que componen esta cotizacion de trabajo',
        isArray: true
    })
    @IsArray({message: 'Los conceptos deben ser un array'})
    @ValidateNested({ each: true })
    @Type(() => CreateCotizacionConceptoDto)
    conceptos: CreateCotizacionConceptoDto[];

    @ApiProperty({example: 'CLI000123', description: 'Cliente de la Orden'})
    @IsOptional()
    @IsString()
    @Length(6, 9, {message: 'El cliente debe ser de 9 caracteres'})    
    @Transform( ({value}) => value?.toLowerCase() ) 
    id_cliente?: string;
        
    @ApiProperty({ example: 'MOD000123', description: 'Modelo del Vehículo'})
    @IsOptional()
    @IsString()
    @Length(9,9, {message: 'La clave de modelo debe ser de 9 caracteres'})
    @Transform( ({value}) => value?.toLowerCase() ) 
    id_modelo?: string

    @ApiProperty({example: '2020', description: 'Año del Vehículo'})
    @IsOptional()
    @IsInt({message: "El año debe ser un número entero"})
    @Min(1900, {message: 'El año no puede ser menor a 1900'})
    @Max(new Date().getFullYear() + 1, {message: `El año no puede ser mayor a ${ new Date().getFullYear() + 1 }`})
    //@Transform( ({value}) => Number(value))
    @Transform( ({value}) => value === null || value === '' ? undefined : Number(value) )
    anio?: number

    @ApiProperty({example: 'VEH000123', description: 'Vehículo de la Orden'})
    @IsOptional()
    @IsString()
    @Length(9, 9, {message: 'El vehículo debe ser de 9 caracteres'})
    @Transform( ({value}) => value?.toLowerCase() ) 
    id_vehiculo?: string;    
    
    @ApiProperty({example: 'EMP000123', description: 'Empresa de la Orden en caso de aplicar'})
    @IsOptional()
    @IsString()
    @Length(6, 9, {message: 'La empresa debe ser de 9 caracteres'})    
    @Transform( ({value}) => value?.toLowerCase() ) 
    id_empresa?: string;

}
