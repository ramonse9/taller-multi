import { UpdateOrdenEstatusResponseDto } from './dto/update-orden-estatus-response.dto';
import { Controller, Get, Post, Body, Patch, Param, Query, UseInterceptors, UploadedFiles, HttpCode, ClassSerializerInterceptor, Res, Header } from '@nestjs/common';
import { OrdenesService } from './ordenes.service';
import { CreateOrdenDto } from './dto/create-orden.dto';
import { UpdateOrdenDto } from './dto/update-orden.dto';
import { ForbidFieldsPipe } from '../pipes/forbid-fields/forbid-fields.pipe';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiBadRequestResponse, ApiBearerAuth, ApiBody, ApiConsumes, ApiCreatedResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { OrdenResponseDto } from './dto/orden-response.dto';
import { PaginationQueryDto } from '../DTOs/pagination/pagination-query.dto';
import { OrdenPaginationDto } from './dto/orden-pagination.dto';
import { CreateOrdenNotaDescripcionDto } from './dto/create-orden-nota-descripcion.dto';
import { OrdenNotaResponseDto } from './dto/orden-nota-response.dto';
import { UpdateOrdenEstatusDto } from './dto/update-orden-estatus.dto';
import { LowercasePipe } from '../pipes/lowercase/lowercase.pipe';
import { Auth, GetUser } from '../auth/decorators';
import { User } from '../auth/entities/user.entity';
import { CreateOrdenConceptoDto } from './dto/create-orden-concepto.dto';
import { Orden } from './entities/orden.entity';
import { mapOrdenToResponseDto } from './mappers/orden.mapper';
import { OrdenEstatusTotalResponseDto } from './dto/orden-estatus-total-response.dto';
import { EnumRole } from '../commom/enums/general.enum';
import { UpdateOrdenPagoDto } from './dto/update-orden-pago.dto';
import { Express } from 'express';
import { UpdateOrdenPagoResponseDto } from './dto/update-orden-pago-response.dto';

@ApiTags('Ordenes')
@UseInterceptors(ClassSerializerInterceptor)
@ApiUnauthorizedResponse({ description: 'No autorizado' })
@Controller('ordenes')
export class OrdenesController {
  
  constructor(private readonly ordenesService: OrdenesService) {}
  
  @Post()
  @Auth(EnumRole.ADMIN)
  @HttpCode(201)
  @ApiOperation({summary: 'Crear una nueva Orden'})
  @ApiBody({type: CreateOrdenDto, description: 'Datos requeridos para crear una Orden' })
  @ApiCreatedResponse({ 
    description: 'Orden creada exitosamente',
    schema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          example: 'ord000123'
        }
      }
    }
  })
  async create(@Body() createOrdenDto: CreateOrdenDto, @GetUser() user: User) {  

    const idOrden = await this.ordenesService.createWithNota(createOrdenDto, user);   
    
    return idOrden;
  }
  
  @Post('/notas')
  @Auth(EnumRole.ADMIN)
  @HttpCode(201)
  @ApiOperation({summary: 'Crear una Nota y subir hasta 4 imágenes'})  
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Datos requeridos para crear una Nota con imágenes',
    required: true,
    schema: {
      type: 'object',
      properties: {
        id_orden: {
          type: 'string',
          example: 'ORD000123',
          description: 'Orden de la Nota',
        },
        nota: {
          type: 'string',
          example: 'Esta nota es para esta orden',
          description: 'Descripción o mensaje de la nota',
        },
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          description: 'Hasta 4 imágenes (formato .jpg, .png, etc.)',
        },
      },
      required: ['id_orden', 'nota'],
    },
  })  
  @ApiCreatedResponse({ type: OrdenNotaResponseDto, description: 'Nota creada exitosamente'})
  @UseInterceptors(FilesInterceptor('files', 4, {
    limits: { fileSize: 5 * 1024 * 1024 }
  }))
  createNotaWithImagenes(
    @Body() createOrdenNotaDescripcionDto: CreateOrdenNotaDescripcionDto,
    @GetUser() user: User,
    //@UploadedFiles() files?: any[],
    @UploadedFiles() files?: Express.Multer.File[],
    ){


      

    return this.ordenesService.createNotaWithImagenes( createOrdenNotaDescripcionDto, user, files )

  }
  
  @Get()
  @Auth(EnumRole.ADMIN)
  @ApiOperation({summary: 'Obtener Órdenes (paginado y filtrado)'})
  @ApiOkResponse({description: 'Listado de Órdenes', type: OrdenPaginationDto})
  async getPaginado(
       @Query() query: PaginationQueryDto,
       //@Res({ passthrough: true }) res: Response,
       @GetUser() user: User
  )//: Promise<OrdenPaginationDto> {
  {

    const { page, limit, fSearch } = query;
    const { count, pages, ordenes } = await this.ordenesService.getPaginado( page, limit, fSearch, user )

    /* TODO */
    return {
      page: page,
      limit: limit,
      totalItems: count,
      totalPages: pages,
      hasNextPage: page < pages,
      ordenes: ordenes
      //ordenes: ordenes.map( mapOrdenToResponseDto )
    }
    
  }

  @Get('/totales')
  @Auth(EnumRole.ADMIN)
  @ApiOperation({summary: 'Obtener una Totales por estatus'})
  @ApiOkResponse({ type: OrdenEstatusTotalResponseDto, description: 'Orden encontrada'})
  @ApiNotFoundResponse({description: 'Totales no encontrada'})
  async getTotalesPorEstatus( @GetUser() user: User
  ): Promise<OrdenEstatusTotalResponseDto[]> {  

    const totalesEstatus = await this.ordenesService.getTotalesPorEstatus(user);
    
    return totalesEstatus;
  }
  
  @Get(':id')
  @Auth(EnumRole.ADMIN)
  @ApiOperation({summary: 'Obtener una Orden por su ID'})
  @ApiParam({name: 'id', description: 'ID de la Orden', example: 'ORD000123'})
  @ApiOkResponse({ type: OrdenResponseDto, description: 'Orden encontrada'})
  @ApiNotFoundResponse({description: 'Orden no encontrada'})
  async getOne(@Param('id', new LowercasePipe()) id: string, @GetUser() user: User
  ){ //: Promise<OrdenResponseDto> {  

    const orden = await this.ordenesService.getOne(id, user);

    /* TODO */
    
    return orden
    //return mapOrdenToResponseDto( orden );
  }

  @Patch(':id')  
  @Auth(EnumRole.ADMIN)
  @ApiOperation({summary: 'Actualizar información de la Orden'})
  @ApiParam({name: 'id', description: 'ID de la Orden', example: 'ORD000123'})
  @ApiBody({type: UpdateOrdenDto, description: 'Datos requeridos para actualizar una Orden'})
  @ApiBadRequestResponse({description: 'Datos inválidos'})
  @ApiNotFoundResponse({description: 'Orden no encontrada'})
  @ApiOkResponse({
    description: 'Oden actualizada exitosamente',
    schema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          example: 'ord000123'
        }
      }
    }
  })
  async update(
        @Param('id', new LowercasePipe()) id: string, 
        @Body(new ForbidFieldsPipe(['conceptos'])) updateOrdenDto: UpdateOrdenDto,
        @GetUser() user: User
      ) {

    return await this.ordenesService.update(id, updateOrdenDto, user);

  }

  @Patch('/estatus/:id')
  @Auth(EnumRole.ADMIN)
  @ApiOperation({summary: 'Actualizar el estatus de la Orden, se creará una nueva nota'})
  @ApiParam({name: 'id', description: 'ID de la Orden', example: 'ORD000123'})
  @ApiBody({type: UpdateOrdenEstatusDto, description: 'Datos requeridos para actualizar el estatus de una Orden' })
  @ApiBadRequestResponse({description: 'Datos inválidos'})
  @ApiNotFoundResponse({description: 'Orden no encontrada'})
  @ApiOkResponse({
    description: 'Oden actualizada exitosamente',
    schema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          example: 'ord000123'
        }
      }
    }
  })
  updateEstatus(@Param('id', new LowercasePipe()) id: string, @Body() updateOrdenEstatusDto: UpdateOrdenEstatusDto, @GetUser() user: User){

    return this.ordenesService.updateEstatus(id, updateOrdenEstatusDto, user)

  }

  @Patch('/pagada/:id')
  @Auth(EnumRole.ADMIN)
  @ApiOperation({summary: 'Actualizar el estatus del pago de la Orden'})
  @ApiParam({name: 'id', description: 'ID de la Orden', example: 'ORD000123'})
  @ApiBody({type: UpdateOrdenPagoDto, description: 'Datos requeridos para actualizar el estatus del pago de una Orden' })
  @ApiBadRequestResponse({description: 'Datos inválidos'})
  @ApiNotFoundResponse({description: 'Orden no encontrada'})
  @ApiOkResponse({type: UpdateOrdenPagoResponseDto, description: 'Pago y Fecha Pago'})  
  updatePago(@Param('id', new LowercasePipe()) id: string, @Body() updateOrdenPagoDto: UpdateOrdenPagoDto, @GetUser() user: User){

    return this.ordenesService.updatePago(id, updateOrdenPagoDto, user)

  }

  @Patch('/:id/conceptos')
  @Auth(EnumRole.ADMIN)
  @ApiOperation({summary: 'Actualizar los conceptos de la Orden'})
  @ApiParam({name: 'id', description: 'ID de la Orden', example: 'ORD000123'})
  @ApiBody({type: CreateOrdenConceptoDto, isArray: true, description: 'Datos requeridos para actualizar los conceptos de una Orden' })
  @ApiBadRequestResponse({description: 'Datos inválidos'})
  @ApiNotFoundResponse({description: 'Orden no encontrada'})
  @ApiOkResponse({
    description: 'Conceptos de la Orden actualizados correctamente',
    schema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          example: 'ord000123'
        }
      }
    }
  })
  async updateConceptos(@Param('id', new LowercasePipe()) id: string, @Body() createOrdenConceptoDto: CreateOrdenConceptoDto[], @GetUser() user: User){

    const idOrdenUpdated = await this.ordenesService.updateConceptos(id, createOrdenConceptoDto, user)

    return idOrdenUpdated

  }
}
