import { CreateOrdenConceptoDto } from './../../ordenes/dto/create-orden-concepto.dto';
import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsArray, IsEnum, ValidateNested } from "class-validator";
import { EnumSatTipoPersona } from './../../commom/enums/general.enum';

export class CalcularImpuestosDto {    
    
    @ApiProperty({enum: EnumSatTipoPersona, description: 'Sat Tipo Persona', example: EnumSatTipoPersona.MORAL})
    @IsEnum(EnumSatTipoPersona, { message: 'El tipo de persona debe ser FISICA o MORAL' })    
    receptorSatTipoPersona: EnumSatTipoPersona;

    @ApiProperty({
        type: CreateOrdenConceptoDto, 
        description: 'Listado de conceptos',
        isArray: true
    })
    @IsArray({message: 'Los conceptos deben ser un array'})
    @ValidateNested({ each: true })
    @Type(() => CreateOrdenConceptoDto)
    conceptos: CreateOrdenConceptoDto[];   
        
}
