import { Transform } from "class-transformer";
import { IsEmail, IsString, Matches, MaxLength, MinLength } from "class-validator";

export class CreateUserDto {

    @IsString()
    @IsEmail()
    email: string;

    @IsString()
    @MinLength(6)
    @MaxLength(20)
    @Transform(({ value }) => value.trim())
    @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/,
    {
        message: 'La contraseña debe tener al menos una mayúscula, una minúscula, un número y mínimo 6 caracteres'
    }
    )    
    password: string;
    
}
