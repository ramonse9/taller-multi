import { SatRegimenFiscal } from './../../sat/entities/sat-regimen-fiscal.entity';
import { ApiProperty, OmitType, PartialType } from "@nestjs/swagger";
import { CreateEmisorDto } from "./create-emisor.dto";

export class EmisorResponseDto extends OmitType( PartialType( CreateEmisorDto ), ['claveSatRegimenFiscal'] as const ) {

    @ApiProperty({example: 'EMI000123', description: 'ID del Emisor'})
    id: string;

    @ApiProperty({example: 'true', description: 'Se encuentra activo?' })
    isActive: boolean;

    @ApiProperty({example: '2025-01-01 20:14:44.933942+00' })
    validFrom: Date;

    @ApiProperty({example: '2030-01-01 20:14:44.933942+00' })
    validTo: Date;

    @ApiProperty({type: () => SatRegimenFiscal, description: 'Regimen Fiscal del Emisor'})
    satRegimenFiscal: SatRegimenFiscal;

    @ApiProperty({example: '2025-04-18 20:14:44.933942+00' })
    updatedAt: Date;
}