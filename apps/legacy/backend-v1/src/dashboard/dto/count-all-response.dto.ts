import { ApiProperty } from "@nestjs/swagger";

export class CountAllResponseDto{

    @ApiProperty({example: 123, description: 'Total de Órdenes' })
    ordenes: number

    @ApiProperty({example: 123, description: 'Total de Vehículos' })
    vehiculos: number

    @ApiProperty({example: 123, description: 'Total de Clientes' })
    clientes: number
    
    @ApiProperty({example: 123, description: 'Total de Empresas' })
    empresas: number

    @ApiProperty({example: 123, description: 'Total de Marcas' })
    marcas: number

    @ApiProperty({example: 123, description: 'Total de Modelos' })
    modelos: number

}