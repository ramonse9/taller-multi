import { ApiProperty } from "@nestjs/swagger";
import { IsDecimal, IsNotEmpty, IsString, Matches} from "class-validator";

export class CreateEmpleadoDto {

    @ApiProperty({ example: 'Javier Lopez', description: 'Nombre del empleado' })
    @IsString()
    nombre: string;

    @ApiProperty({ example: '2000', description: 'Salario Base' })
    @IsNotEmpty({ message: 'El salario base es obligatorio para cada empleado.' })
    @IsDecimal({ decimal_digits: '0,2' }, { message: 'El salario base solo puede tener máximo 2 decimales' })
    @Matches(/^(?!-)(\d+)(\.\d{1,2})?$/, {
        message: 'El salario base no puede ser negativo y debe tener máximo 2 decimales',
    })
    salarioBase: string;

}
