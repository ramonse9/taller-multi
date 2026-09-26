import { Controller, Get, Post, Body, Patch, Param, HttpCode, Query, UseInterceptors, ClassSerializerInterceptor } from '@nestjs/common';
import { CotizacionesService } from './cotizaciones.service';
import { CreateCotizacionDto } from './dto/create-cotizacion.dto';
import { UpdateCotizacionDto } from './dto/update-cotizacion.dto';
import { ApiOperation, ApiBody, ApiCreatedResponse, ApiOkResponse, ApiParam, ApiNotFoundResponse, ApiBadRequestResponse, ApiTags, ApiBearerAuth, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { Auth, GetUser } from '../auth/decorators';
import { User } from '../auth/entities/user.entity';
import { CotizacionPaginationDto } from './dto/cotizacion-pagination.dto';
import { PaginationQueryDto } from './../DTOs/pagination/pagination-query.dto';
import { mapCotizacionToResponseDto } from './mappers/cotizacion.mapper';
import { CotizacionResponseDto } from './dto/cotizacion-response.dto';
import { LowercasePipe } from './../pipes/lowercase/lowercase.pipe';
import { CreateCotizacionConceptoDto } from './dto/create-cotizacion-concepto.dto';
import { EnumRole } from '../commom/enums/general.enum';

@ApiTags('Cotizaciones')
@UseInterceptors(ClassSerializerInterceptor)
@ApiUnauthorizedResponse({ description: 'No autorizado' })
@Controller('cotizaciones')
export class CotizacionesController {
  constructor(private readonly cotizacionesService: CotizacionesService) {}

  @Post()  
  @Auth(EnumRole.ADMIN)
  @HttpCode(201)
  @ApiOperation({summary: 'Crear una nueva Cotizacion'})
  @ApiBody({type: CreateCotizacionDto, description: 'Datos requeridos para crear una Cotizacion' })
  @ApiCreatedResponse({
    description: 'Cotizacion creada exitosamente',
    schema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          example: 'cot000123'
        }
      }
    }
  })
  create(@Body() createCotizacionDto: CreateCotizacionDto, @GetUser() user: User) {
    return this.cotizacionesService.create(createCotizacionDto, user);
  }

  @Get()
  @Auth(EnumRole.ADMIN)
  @ApiOperation({summary: 'Obtener Cotizaciones (paginado y filtrado)'})
  @ApiOkResponse({description: 'Listado de Cotizaciones', type: CotizacionPaginationDto})
  async getPaginado(
    @Query() query: PaginationQueryDto,
    @GetUser() user: User,
  ): Promise<CotizacionPaginationDto> {

    const { page, limit, fSearch } = query;
    const { count, pages, cotizaciones } = await this.cotizacionesService.getPaginado(page, limit, fSearch, user);

    
    return {
      page: page, 
      limit: limit, 
      totalItems: count, 
      totalPages: pages,
      hasNextPage: page < pages,
      cotizaciones: cotizaciones.map( mapCotizacionToResponseDto )
    };
  }

  @Get(':id')
  @Auth(EnumRole.ADMIN)
  @ApiOperation({summary: 'Obtener una Cotizacion por su ID'})
  @ApiParam({name: 'id', description: 'ID de la Cotizacion', example: 'COT000123'})
  @ApiOkResponse({ type: CotizacionResponseDto, description: 'Cotizacion encontrada'})
  @ApiNotFoundResponse({description: 'Cotizacion no encontrada'})
  async getOne(@Param('id', new LowercasePipe()) id: string, @GetUser() user: User
  ): Promise<CotizacionResponseDto> {  

    const cotizacion = await this.cotizacionesService.getOne(id, user);
    
    return mapCotizacionToResponseDto( cotizacion );
  }

  @Patch(':id')  
  @Auth(EnumRole.ADMIN)
  @ApiOperation({summary: 'Actualizar información de la Cotizacion'})
  @ApiParam({name: 'id', description: 'ID de la Cotizacion', example: 'COT000123'})
  @ApiBody({type: UpdateCotizacionDto, description: 'Datos requeridos para actualizar una Cotizacion'})
  @ApiBadRequestResponse({description: 'Datos inválidos'})
  @ApiNotFoundResponse({description: 'Cotizacion no encontrada'})
  @ApiOkResponse({
    description: 'Cotizacion actualizada exitosamente',
    schema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          example: 'cot000123'
        }
      }
    }
  })
  async update(
        @Param('id', new LowercasePipe()) id: string, 
        //@Body(new ForbidFieldsPipe(['id_vehiculo', 'id_cliente', 'id_empresa', 'conceptos'])) updateCotizacionDto: UpdateCotizacionDto,
        @Body() updateCotizacionDto: UpdateCotizacionDto,
        @GetUser() user: User
      ) {
        
    return await this.cotizacionesService.update(id, updateCotizacionDto, user);

  }

  @Patch('/:id/conceptos')
  @Auth(EnumRole.ADMIN)
  @ApiOperation({summary: 'Actualizar los conceptos de la Cotizacion'})
  @ApiParam({name: 'id', description: 'ID de la Cotizacion', example: 'COT000123'})
  @ApiBody({type: CreateCotizacionConceptoDto, isArray: true, description: 'Datos requeridos para actualizar los conceptos de una Cotizacion' })
  @ApiBadRequestResponse({description: 'Datos inválidos'})
  @ApiNotFoundResponse({description: 'Cotizacion no encontrada'})
  @ApiOkResponse({
    description: 'Conceptos de la Cotizacion actualizados correctamente',
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
  async updateConceptos(@Param('id', new LowercasePipe()) id: string, @Body() createCotizacionConceptoDto: CreateCotizacionConceptoDto[], @GetUser() user: User){

    const idCotizacionUpdated = await this.cotizacionesService.updateConceptos(id, createCotizacionConceptoDto, user)

    return idCotizacionUpdated

  }

}
