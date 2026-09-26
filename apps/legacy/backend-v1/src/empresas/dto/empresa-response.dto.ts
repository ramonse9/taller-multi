import { SatUsoCFDIResponseDto } from './../../productos-servicios/dto/sat-uso-cfdi-response.dto';
import { SatRegimenFiscalResponseDto } from './../../productos-servicios/dto/sat-regimen-fiscal-response.dto';
import { ApiProperty, OmitType, PartialType } from "@nestjs/swagger";
import { CreateEmpresaDto } from "./create-empresa.dto";
import { Type } from 'class-transformer';

export class EmpresaResponseDto extends OmitType( PartialType (CreateEmpresaDto ), ['claveSatRegimenFiscal', 'claveSatUsoCFDI'] as const ) {

    @ApiProperty({example: 'EMP000123', description: 'ID de la Empresa'})
    id: string

    @ApiProperty({type: () => SatRegimenFiscalResponseDto, description: 'Regimen Fiscal del Cliente'})
    @Type( () => SatRegimenFiscalResponseDto )
    satRegimenFiscal: SatRegimenFiscalResponseDto;

    @ApiProperty({type: () => SatUsoCFDIResponseDto, description: 'Uso CFDI del Cliente'})
    @Type( () => SatUsoCFDIResponseDto )
    satUsoCFDI: SatUsoCFDIResponseDto;

    @ApiProperty({example: '2025-04-18 20:14:44.933942+00' })
    updatedAt: Date

    @ApiProperty({example: '2025-04-18 20:14:44.933942+00' })
    createdAt: Date
}