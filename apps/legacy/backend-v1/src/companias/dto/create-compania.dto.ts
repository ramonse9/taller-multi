import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, Length, Matches, MinLength } from 'class-validator';
import { TENANT_SCHEMA_PATTERN } from '../../tenant/tenant-schema-name';

export class CreateCompaniaDto {

    @IsNotEmpty()
    @IsString()
    @MinLength(5, {message: 'El nombre debe de ser al menos de 5 caracteres'})
    nombre: string;

    @Transform(({ value }) => typeof value === 'string' ? value.trim().toLowerCase() : value)
    @IsString()
    @Matches(TENANT_SCHEMA_PATTERN, {
        message: 'El schema debe tener entre 3 y 50 caracteres, iniciar con una letra y contener únicamente letras minúsculas, números o guion bajo',
    })
    schema: string;

    @IsNotEmpty()
    @IsString()
    tipo_compania_tipo_giro: string;

    @IsNotEmpty()
    @IsString()
    tipo_sat_tipo_persona: string;

    @IsNotEmpty()
    @Length(2, 2, {message: 'La retencion de ISR debe de ser de 2 caracteres'})
    id_sat_retencion_isr: string;

    @IsNotEmpty()
    @Length(2, 2, {message: 'La retencion de IVA debe de ser de 2 caracteres'})
    id_sat_retencion_iva: string;

}
