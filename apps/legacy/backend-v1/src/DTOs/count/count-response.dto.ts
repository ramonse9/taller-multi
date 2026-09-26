import { ApiProperty } from "@nestjs/swagger";

export class CountResponseDto{
    @ApiProperty({example: 123, description: 'Total de registros'})
    count: number;
}