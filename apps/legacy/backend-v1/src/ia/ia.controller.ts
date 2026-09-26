import { Body, ClassSerializerInterceptor, Controller, HttpCode, Post, UseInterceptors } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags, ApiUnauthorizedResponse } from "@nestjs/swagger";
import { IAService } from './ia.service';
import { EnumRole } from "../commom/enums/general.enum";
import { ExtraerCamposDelTextoDto } from "./dto/ExtraerCamposDelTexto.dto";
import { Auth } from "../auth/decorators";
import { Throttle } from "@nestjs/throttler";

@ApiTags('IA')
@UseInterceptors(ClassSerializerInterceptor)
@ApiUnauthorizedResponse({ description: 'No autorizado' })
@Controller('ia')
export class IAController{
    
    constructor(private readonly iaService: IAService){}

    @Post()
    @Throttle({ default: { limit: 15, ttl: 60000 } })
    @Auth(EnumRole.CAPTURISTA)
    @HttpCode(201)
    @ApiOperation({summary: "Extraer campos del texto"})
    @ApiBody({type: ExtraerCamposDelTextoDto, description: 'Datos requeridos para extraer los campos del texto'})
    extraerCamposDelTexto(@Body() extraerCamposDelTextoDto: ExtraerCamposDelTextoDto ){
        return this.iaService.extraerCamposDelTexto( extraerCamposDelTextoDto)
    }

    
}
