import { ApiProperty } from "@nestjs/swagger";
import { CreateCompaniaTipoGiroDto } from "./create-compania-tipo-giro.dto";

export class CompaniaTipoGiroResponseDto extends CreateCompaniaTipoGiroDto{

    @ApiProperty()
    createdAt: Date;
    
}