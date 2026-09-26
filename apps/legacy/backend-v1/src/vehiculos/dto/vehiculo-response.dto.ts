import { ApiProperty } from "@nestjs/swagger";
import { Modelo } from '../../modelos/entities/modelo.entity';
import { ModeloResponseDto } from "../../modelos/dto/modelo-response.dto";
import { Type } from "class-transformer";

export class VehiculoResponseDto{

    @ApiProperty({example: 'VEH000123', description: 'ID del Vehículo'})
    id: string;

    @ApiProperty({example: '2020', description: 'Año del Vehículo'})
    anio: number
    
    @ApiProperty({example: 'Rojo', description: 'Color del Vehículo'})
    color: string
    
    @ApiProperty({example: 'VPU-872-C', description: 'Placa del Vehículo'})
    placa?: string
        
    @ApiProperty({example: '1HGBH41JXMN109186', description: 'Número de Serie del Vehículo'})
    numeroSerie:string
    
    @ApiProperty({ type: () => ModeloResponseDto, description: 'Modelo del Vehículo'})
    @Type( () => ModeloResponseDto )
    modelo: ModeloResponseDto
    //modelo: Modelo

}
