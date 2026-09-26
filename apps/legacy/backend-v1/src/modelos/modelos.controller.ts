import { Controller, Get, Post, Body, Patch, Param, HttpCode, Query, UseInterceptors, ClassSerializerInterceptor} from '@nestjs/common';
import { ModelosService } from './modelos.service';
import { CreateModeloDto } from './dto/create-modelo.dto';
import { UpdateModeloDto } from './dto/update-modelo.dto';
import { ApiBadRequestResponse, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags, ApiParam, ApiNotFoundResponse, ApiBody, ApiBearerAuth, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { ModeloResponseDto } from './dto/modelo-response.dto';
import { ModeloPaginationDto } from './dto/modelo-pagination.dto';
import { PaginationQueryDto } from '../DTOs/pagination/pagination-query.dto';
import { LowercasePipe } from '../pipes/lowercase/lowercase.pipe';
import { Auth, GetUser } from '../auth/decorators';
import { User } from '../auth/entities/user.entity';
import { EnumRole } from '../commom/enums/general.enum';

@ApiTags('Modelos')
@UseInterceptors(ClassSerializerInterceptor)
@ApiUnauthorizedResponse({ description: 'No autorizado' })
@Controller('modelos')
export class ModelosController {

  constructor(private readonly modelosService: ModelosService) {}

  @Post()
  @Auth(EnumRole.CAPTURISTA)
  @HttpCode(201)
  @ApiOperation({summary: 'Crear un nuevo Modelo'})
  @ApiBody({type: CreateModeloDto, description: 'Datos requeridos para crear un Modelo'})
  @ApiCreatedResponse({description: 'Modelo creado exitosamente', type: ModeloResponseDto})
  @ApiBadRequestResponse({description: 'Datos inválidos'})
  create(@Body() createModeloDto: CreateModeloDto, @GetUser() user: User): Promise<ModeloResponseDto>{

    return this.modelosService.create(createModeloDto, user);

  }

  @Get()
  @Auth(EnumRole.CAPTURISTA)
  @ApiOperation({summary: 'Obtener Modelos (paginado y filtrado)'})
  @ApiOkResponse({description: 'Listado de Modelos', type: ModeloPaginationDto })
  async getPaginado(
    @Query() query: PaginationQueryDto
  ):Promise<ModeloPaginationDto> {
    
    const { page, limit, fSearch } = query
    const { count, pages, modelos } = await this.modelosService.getPaginado( page, limit, fSearch)

    return {
      page: page,
      limit: limit,
      totalItems: count,
      totalPages: pages,
      hasNextPage: page < pages,      
      modelos: modelos,    
    }

  }

  @Get(':id')
  @Auth(EnumRole.CAPTURISTA)
  @ApiOperation({summary: 'Obtener un Modelo por su ID'})
  @ApiParam({name: 'id', description: 'ID del Modelo', example: 'MOD000123' })
  @ApiOkResponse({description: 'Modelo encontrado', type: ModeloResponseDto})
  @ApiNotFoundResponse({description: 'Modelo no encontrado'})  
  getOne(@Param('id', new LowercasePipe()) id: string): Promise<ModeloResponseDto> {
   
    return this.modelosService.getOne(id)

  }

  @Patch(':id')
  @Auth(EnumRole.CAPTURISTA)
  @ApiOperation({summary: 'Actualizar información del Modelo'})
  @ApiParam({name: 'id', description: 'ID del Modelo', example: 'MOD000123'})
  @ApiBody({type: UpdateModeloDto, description: 'Datos requeridos para actualizar un modelo'})
  @ApiOkResponse({type: ModeloResponseDto, description: 'Modelo actualizado exitosamente'})
  @ApiBadRequestResponse({description: 'Datos inválidos'})
  @ApiNotFoundResponse({description: 'Modelo no encontrado'})
  update(@Param('id', new LowercasePipe()) id: string, @Body() updateModeloDto: UpdateModeloDto, @GetUser() user: User): Promise<ModeloResponseDto> {

    return this.modelosService.update(id, updateModeloDto, user);

  }

}
