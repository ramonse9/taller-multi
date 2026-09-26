import { EnumRole } from './../commom/enums/general.enum';
import { Controller, Post, Body, HttpCode, UseInterceptors, ClassSerializerInterceptor } from '@nestjs/common';
import { CompaniasService } from './companias.service';
import { CreateCompaniaDto } from './dto/create-compania.dto';
import { Auth } from '../auth/decorators';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';

@ApiTags('Companias')
@UseInterceptors(ClassSerializerInterceptor)
@ApiUnauthorizedResponse({ description: 'No autorizado' })
@Controller('companias')
export class CompaniasController {
  constructor(private readonly companiasService: CompaniasService) {}

  @Post()
  @Auth(EnumRole.SUPER)
  @HttpCode(201)
  @ApiOperation({summary: 'Crear una nueva Compañía'})  
  create(@Body() createCompaniaDto: CreateCompaniaDto) {
    return this.companiasService.create(createCompaniaDto);
  }

}
