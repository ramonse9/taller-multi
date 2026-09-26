import { SatUsoCFDIResponseDto } from './../../productos-servicios/dto/sat-uso-cfdi-response.dto';
import { SatRegimenFiscalResponseDto } from './../../productos-servicios/dto/sat-regimen-fiscal-response.dto';
import { ApiProperty, OmitType, PartialType } from "@nestjs/swagger";
import { CreateClienteDto } from "./create-cliente.dto";
import { Type } from 'class-transformer';

export class ClienteResponseDto extends OmitType( PartialType (CreateClienteDto ), ['claveSatRegimenFiscal', 'claveSatUsoCFDI'] as const ) {
    @ApiProperty({example: 'CLI000123', description: 'ID del Cliente'})
    id: string;

    @ApiProperty({type: () => SatRegimenFiscalResponseDto, description: 'Regimen Fiscal del Cliente'})
    @Type( () => SatRegimenFiscalResponseDto )
    satRegimenFiscal: SatRegimenFiscalResponseDto;

    @ApiProperty({type: () => SatUsoCFDIResponseDto, description: 'Uso CFDI del Cliente'})
    @Type( () => SatUsoCFDIResponseDto)
    satUsoCFDI: SatUsoCFDIResponseDto;

    @ApiProperty({ example: '2025-01-01T12:00:00Z' })    
    updatedAt: Date;

    @ApiProperty({ example: '2025-01-01T12:00:00Z' })    
    createdAt: Date;
}