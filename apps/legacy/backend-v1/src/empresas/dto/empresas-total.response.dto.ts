import { ApiProperty } from "@nestjs/swagger";

export class EmpresasTotalResponseDto{
    @ApiProperty({example: 123, description: 'Total de Empresas'})
    total: number
}