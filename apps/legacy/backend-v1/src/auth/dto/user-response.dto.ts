import { ApiProperty } from "@nestjs/swagger";

export class UserResponseDto {
    @ApiProperty({example: 'USU000123', description: 'ID del Usuario'})
    id: string;

    @ApiProperty({example: 'Juan López', description: 'Nombre del Usuario'})
    fullName: string;
    
}