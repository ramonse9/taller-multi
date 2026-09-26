import { ApiProperty } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import { IsArray, IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString, Length, MaxLength, Min, ValidateNested } from "class-validator";
import { CreateOrdenConceptoDto } from "./create-orden-concepto.dto";
import { CreateVehiculoDto } from "../../vehiculos/dto/create-vehiculo.dto";
import { CreateClienteDto } from "../../clientes/dto/create-cliente.dto";
import { CreateEmpresaDto } from "../../empresas/dto/create-empresa.dto";

export class CreateOrdenDto {

    @ApiProperty({example: 'Descripción breve de lo que se hará en esta Orden', description: 'Descripción de la Orden'})
    @IsNotEmpty({message: 'Debes agregar una descripcion'})    
    descripcion: string;
   
    @ApiProperty({
        description: 'Fecha de ingreso en formato ISO (UTC)',
        example: '2025-12-31T04:13:00.000Z',
        required: true
    })
    @IsNotEmpty({ message: 'La fecha de Ingreso es obligatoria' })
    @IsDateString(
        {},
        { message: 'La fecha ingreso debe ser una fecha ISO 8601 válida (ej: 2025-12-31T04:13:00.000Z)'}
    )   
    fechaIngreso: string

    
    /*@ApiProperty({
        type: String,
        format: 'date-time',
        description: 'Fecha Entrega Estimada del vehículo en formato ISO (UTC)',
        example: '2025-12-31T04:13:00.000Z',
    })
    @IsNotEmpty({ message: 'La fecha es obligatoria' })
    @IsDateString(
        {},
        { message: 'La fecha estimada debe ser una fecha ISO 8601 válida (ej: 2025-12-31T04:13:00.000Z)'}
    ) 
    fechaEntregaEstimada: string;
    */

    @ApiProperty({
        type: String,
        format: 'date-time',
        description: 'Fecha Entrega Real del vehículo en formato ISO (UTC)',
        example: '2025-12-31T04:13:00.000Z',
    })
    @IsOptional()   
    @IsDateString(
        {},
        { message: 'La fecha debe ser una fecha ISO 8601 válida (ej: 2025-12-31T04:13:00.000Z)'}
    ) 
    fechaEntregaReal?: string;
        
    @ApiProperty({example: '23000', description: 'Kilómetros con los que llegó el vehículo'})
    @IsOptional()
    @Type( () => Number )
    @IsNumber({maxDecimalPlaces: 2}, {message: 'Los kilómetros solo puede tener máximo 2 decimales'})
    @Min(0, { message: 'Los kilómetros no pueden ser negativos'})
    kilometros: number;

    @ApiProperty({example: '5700367207-1', description: 'Clave de la Póliza en caso de aplicar'})
    @IsOptional()    
    @MaxLength(20, {message: 'La Póliza no puede tener mas de 20 caracteres'})
    @Transform(({value}) => value?.toLowerCase())
    poliza?: string;

    @ApiProperty({example: '25-0352268', description: 'Clave de Siniestro en caso de aplicar'})
    @IsOptional()    
    @MaxLength(20, {message: 'El siniestro no puede tener mas de 20 caracteres'})
    @Transform( ({value}) => value?.toLowerCase() ) 
    siniestro?: string;

    @ApiProperty({example: 'folio', description: 'Folio Nota'})
    @IsOptional()    
    @MaxLength(20, {message: 'El folio nota no puede tener mas de 20 caracteres'})
    @Transform( ({value}) => value?.toLowerCase() ) 
    folioNota?: string;
    
    @ApiProperty({
        type: CreateOrdenConceptoDto, 
        description: 'Listado de conceptos que componen esta orden de trabajo',
        isArray: true
    })
    @IsArray({message: 'Los conceptos deben ser un array'})
    @ValidateNested({ each: true })
    @Type(() => CreateOrdenConceptoDto)
    conceptos: CreateOrdenConceptoDto[];

    @ApiProperty({example: 'VEH000123', description: 'Id del Vehículo de la Orden'})
    @IsOptional()
    @IsString()
    @Length(9, 9, {message: 'El vehículo debe ser de 9 caracteres'})
    @Transform( ({value}) => value === '' ? undefined : value?.toLowerCase() ) 
    id_vehiculo: string;

    @ApiProperty({example: 'CLI000123', description: 'Id del Cliente de la Orden'})    
    @IsOptional()
    @IsString()
    @Length(6, 9, {message: 'El cliente debe ser de 9 caracteres'})    
    @Transform( ({value}) => value === '' ? undefined : value?.toLowerCase() ) 
    id_cliente?: string;
    
    @ApiProperty({example: 'EMP000123', description: 'Id de la Empresa de la Orden'})
    @IsOptional()
    @IsString()
    @Length(6, 9, {message: 'La empresa debe ser de 9 caracteres'})    
    @Transform( ({value}) => value === '' ? undefined : value?.toLowerCase() ) 
    id_empresa?: string;

    @ApiProperty({
        type: CreateVehiculoDto,
        description: 'Datos para crear un vehículo nuevo junto con la orden',
        required: false
    })
    @IsOptional()
    @ValidateNested()
    @Type(() => CreateVehiculoDto)
    vehiculoForm?: CreateVehiculoDto;
    
    @ApiProperty({
        type: CreateClienteDto,
        description: 'Datos para crear un cliente nuevo junto con la orden',
        required: false
    })
    @IsOptional()
    @ValidateNested()
    @Type(() => CreateClienteDto)
    clienteForm?: CreateClienteDto;

    @ApiProperty({
        type: CreateEmpresaDto,
        description: 'Datos para crear una empresa nueva junto con la orden',
        required: false
    })
    @IsOptional()
    @ValidateNested()
    @Type(() => CreateEmpresaDto)
    empresaForm?: CreateEmpresaDto;


}
