import { ApiProperty } from "@nestjs/swagger";

export class OrdenMinimalResponseDto {

    @ApiProperty({example: 'ORD000123', description: 'ID de la Orden'})
    id: string;

    @ApiProperty({example: 'Vigente', description: 'Estatus'})
    estatus: string;

    /*
    @ApiProperty({example: '999.99', description: 'Total Factura'})
    totalFactura: number;
    */

}

