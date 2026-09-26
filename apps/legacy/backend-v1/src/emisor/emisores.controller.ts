import { Controller, Get, Post, Body, Patch, Param, UseInterceptors, UploadedFiles, BadRequestException, HttpCode, ClassSerializerInterceptor } from '@nestjs/common';
import { EmisoresService } from './emisores.service';
import { CreateEmisorDto } from './dto/create-emisor.dto';
import { UpdateEmisorDto } from './dto/update-emisor.dto';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { User } from '../auth/entities/user.entity';
import { Auth, GetUser } from '../auth/decorators';
import { ApiBody, ApiConsumes, ApiCreatedResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { EmisorAllDto } from './dto/emisor-all.dto';
import { EmisorResponseDto } from './dto/emisor-response.dto';
import { EnumRole } from '../commom/enums/general.enum';

ApiTags('Emisores')
@UseInterceptors(ClassSerializerInterceptor)
@ApiUnauthorizedResponse({ description: 'No autorizado' })
@Controller('emisores')
export class EmisoresController {
  
  constructor(private readonly emisoresService: EmisoresService) {}

  /*
  @Post()
  create(@Body() createEmisorDto: CreateEmisorDto) {
    return this.emisoresService.create(createEmisorDto);
  }
*/
    
  @Post()
  @Auth(EnumRole.ADMIN)
  @HttpCode(201)
  @ApiOperation({summary: 'Registrar un emisor'})
  @ApiBody({type: CreateEmisorDto, description: 'Datos requeridos para registrar un emisor'})
  @ApiCreatedResponse({ type: EmisorResponseDto, description: 'Emisor creado exitosamente'})
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'cer', maxCount: 1},
      { name: 'key', maxCount: 1}
    ])
  )
  uploadCertificados(
    @GetUser() user: User,
    @Param('id') id: string,
    @UploadedFiles() files: {
      cer?: Express.Multer.File[],
      key?: Express.Multer.File[]
    },
    @Body() createEmisorDto: CreateEmisorDto,    
  ){

    if(!files.cer || !files.key){
      throw new BadRequestException('Se requieren ambos archivos: .cer y .key');
    }

    return this.emisoresService.createEmisor( createEmisorDto, user )

  }  

  @Get()
  @Auth(EnumRole.ADMIN)
  @HttpCode(201)
  @ApiOperation({summary: 'Obtener emisor'})
  @ApiOkResponse({description: 'Emisor', type: EmisorAllDto})
  getOne(    
        @GetUser() user: User
  //): Promise<EmisorResponseDto> {
  ) {    
    return this.emisoresService.getOne( user )
  }

  @Patch()
  @Auth(EnumRole.ADMIN)
  @HttpCode(201)
  @ApiOperation({summary: 'Actualizar los archivos del emisor'})  
  @ApiOkResponse({description: 'Vehiculo encontrada', type: EmisorResponseDto})
  @ApiNotFoundResponse({description: 'Emisor no encontrado'})
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Datos requeridos para actualizar los archivos del Emisor',
    required: true,
    schema: {
      type: 'object',
      properties: {
        password: {
          type: 'string', 
          example: '123456789',
          description: 'Contraseña del archivo .key'
        },
        rfc: {
          type: 'string',
          example: 'ABCD800101XYZ',
          description: 'RFC'
        },
        cer: {
          type: 'string',
          format: 'binary',
          description: 'Archivo .cer',
        },
        key: {
          type: 'string',
          format: 'binary',
          description: 'Archivo .key'
        }
      },
      required: ['rfc','password', 'cer', 'key' ]
    }
  })
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'cer', maxCount: 1},
      { name: 'key', maxCount: 1}
    ])
  )
  update(
      @Body() updateEmisorDto: UpdateEmisorDto, 
      @GetUser() user: User,
      @UploadedFiles() files: { cer?: Express.Multer.File[], key?: Express.Multer.File[] }      
    ) {

    if(!files.cer || !files.key){
      throw new BadRequestException('Se requieren ambos archivos: .cer y .key')
    }

    return this.emisoresService.updateArchivos(updateEmisorDto, user, files.cer[0].buffer, files.key[0].buffer );
  }

}


