import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, MaxLength } from "class-validator";

export class LoginUserDto{
    
    @ApiProperty({example: 'usuario@gmail.com', description:'Correo electrónico del usuario'}) 
    @IsString()
    @IsEmail({},{message: "Revisa el formato del correo"})
    email: string;

    @ApiProperty({example: '123456', description: 'Contraseña del usuario'})
    @IsString()    
    @MaxLength(20, {message: 'La contraseña no debe tener más de 20 caracteres'})    
    password: string;

}