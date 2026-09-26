import { EnumRole } from './../../commom/enums/general.enum';
import { SatUsoCFDIResponseDto } from './../../productos-servicios/dto/sat-uso-cfdi-response.dto';
import { SatRegimenFiscalResponseDto } from './../../productos-servicios/dto/sat-regimen-fiscal-response.dto';
import { ApiProperty, OmitType, PartialType } from "@nestjs/swagger";
//import { CreateClienteDto } from "./create-cliente.dto";
import { Type } from 'class-transformer';

class CompaniaResponseDto{
    @ApiProperty()
    id: string;

    @ApiProperty()
    nombre: string;    
}

class ZonaHorariaResponseDto{
    @ApiProperty()
    clave:string;

    @ApiProperty()
    descripcion: string;
}

export class AuthenticatedUserDto{
    
    @ApiProperty()
    id: string;
    
    @ApiProperty()
    fullName: string;

    @ApiProperty()
    role: EnumRole;

    @ApiProperty({type: CompaniaResponseDto})
    compania: CompaniaResponseDto;

    @ApiProperty({type: ZonaHorariaResponseDto })
    zonaHoraria: ZonaHorariaResponseDto
}

export class LoginResponseDto{

    @ApiProperty({type: AuthenticatedUserDto})
    user: AuthenticatedUserDto;

    @ApiProperty()    
    accessToken: string;

    @ApiProperty({
      required: false
    })
    refreshToken?: string;
    
}

export class LoginCheckStatusResponseDto{
    
    @ApiProperty({type: AuthenticatedUserDto})
    user: AuthenticatedUserDto;

}

export class LoginRefreshResponseDto{

    @ApiProperty()
    accessToken: string;

    @ApiProperty({
      required: false
    })
    refreshToken?: string;
}
