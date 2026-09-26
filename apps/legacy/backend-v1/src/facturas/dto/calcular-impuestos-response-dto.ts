import { ApiProperty } from "@nestjs/swagger";

export class CalcularImpuestosResponseDto {    
    
    @ApiProperty({description: 'Subtotal', example: '10000', type: Number})    
    subtotal: number;
    
    @ApiProperty({description: 'IVA Trasladado', example: '1600', type: Number})    
    ivaTrasladado: number;

    @ApiProperty({description: 'ISR Retenido', example: '1000', type: Number})    
    isrRetenido: number;

    @ApiProperty({description: 'IVA Retenido', example: '1000', type: Number})    
    ivaRetenido: number;

    @ApiProperty({description: 'Subtotal', example: '10000', type: Number})    
    total: number;
        
}
