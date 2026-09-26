import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class EmpleadoResponseDto{
    
    @ApiProperty({ example: 'Javier Lopez', description: 'Nombre del empleado' })
    @Expose()
    nombre: string;

    @ApiProperty({ example: 2000, description: 'Salario Base' })
    @Expose()
    salarioBase: number;
    
    @ApiProperty({ example: false, description: 'Si el Empleado está activo' })
    @Expose()
    activo: boolean

}