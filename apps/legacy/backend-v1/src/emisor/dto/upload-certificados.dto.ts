import { IsNotEmpty } from "class-validator";

export class UploadCertificadosDto{
    @IsNotEmpty()
    contrasena_key: string;
}