import { ApiProperty } from "@nestjs/swagger";
import { CreateMarcaDto } from "./create-marca.dto";

export class MarcaResponseDto extends CreateMarcaDto{

    @ApiProperty({example: 'MAR000123'})
    id: string;
    
}