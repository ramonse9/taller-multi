import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";

class OrdenResponseDto{
    @ApiProperty({example: 'ord000123', description: 'Id de la Orden'})
    id: string;
}

export class FacturaSinLiquidarResponseDto{
    
    @ApiProperty({example: 'fac000123', description: 'Id de la Factura'})
    id: string;

    @ApiProperty({example: '12345678-abcd-efgh-ijkl-123456789123', description: 'UUID de la Factura'})
    uuid: string;

    @ApiProperty({example: '10000', description: 'Total de la Factura' })
    total: number;

    @ApiProperty({type: () => OrdenResponseDto})
    @Type( () => OrdenResponseDto)
    orden: OrdenResponseDto;

}