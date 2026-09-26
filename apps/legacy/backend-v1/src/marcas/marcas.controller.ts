import { Controller, Get, Post, Body, Param, Query, HttpCode, Patch, UseInterceptors, ClassSerializerInterceptor } from '@nestjs/common';
import { MarcasService } from './marcas.service';
import { CreateMarcaDto } from './dto/create-marca.dto';
import { UpdateMarcaDto } from './dto/update-marca.dto';
import { ApiBadRequestResponse, ApiBearerAuth, ApiBody, ApiCreatedResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { MarcaResponseDto } from './dto/marca-response.dto';
import { MarcaPaginationDto } from './dto/marca-pagination.dto';
import { PaginationQueryDto } from '../DTOs/pagination/pagination-query.dto';
import { MarcaAllResponseDto } from './dto/marca-all-response.dto';
import { LowercasePipe } from '../pipes/lowercase/lowercase.pipe';
import { Auth, GetUser } from '../auth/decorators';
import { User } from '../auth/entities/user.entity';
import { EnumRole } from '../commom/enums/general.enum';

@ApiTags('Marcas')
@UseInterceptors(ClassSerializerInterceptor)
@ApiUnauthorizedResponse({ description: 'No autorizado' })
@Controller('marcas')
export class MarcasController {
  constructor(private readonly marcasService: MarcasService) {}

  @Post()
  @Auth(EnumRole.CAPTURISTA)
  @HttpCode(201)
  @ApiOperation({summary: 'Crear una nueva Marca'})
  @ApiBody({type: CreateMarcaDto, description: 'Datos requeridos para crear una Marca'})
  @ApiCreatedResponse({description: 'Marca creada exitosamente', type: MarcaResponseDto})
  @ApiBadRequestResponse({description: 'Datos inválidos'})
  create(@Body() createMarcaDto: CreateMarcaDto, @GetUser() user: User): Promise<MarcaResponseDto> {

    return this.marcasService.create(createMarcaDto, user);

  }

  @Get()
  @Auth(EnumRole.CAPTURISTA)
  @ApiOperation({summary: 'Obtener Marcas (paginado y filtrado)'})  
  @ApiOkResponse({description: 'Listado de Marcas', type: MarcaPaginationDto })
  async getPaginado(
    @Query() query: PaginationQueryDto
  ): Promise<MarcaPaginationDto> { 
    
    const { page, limit, fSearch } = query
    const { count, pages, marcas} = await this.marcasService.getPaginado(page, limit, fSearch)

    return {
      page: page,
      limit: limit,
      totalItems: count,
      totalPages: pages,
      hasNextPage: page < pages,      
      marcas: marcas,
    }
        
  }

  @Get('/all')
  @Auth(EnumRole.CAPTURISTA)
  @ApiOperation({summary: 'Obtener todas las Marcas'})
  @ApiOkResponse({description: 'Listado completo de Marcas', type: MarcaAllResponseDto})
  async findAll(): Promise<MarcaAllResponseDto>{

    return await this.marcasService.findAll()

  }

  @Get(':id')
  @Auth(EnumRole.CAPTURISTA)
  @ApiOperation({summary: 'Obtener una Marca por su ID'})  
  @ApiParam({name: 'id', description: 'ID de la Marca', example: 'MAR000123'})
  @ApiOkResponse({description: 'Marca encontrada', type: MarcaResponseDto})
  @ApiNotFoundResponse({description: 'Marca no encontrada'})
  findOne(@Param('id', new LowercasePipe()) id: string) {

    return this.marcasService.findOne(id);

  }
  
  @Patch(':id')
  @Auth(EnumRole.CAPTURISTA)
  @ApiOperation({summary: 'Actualizar información de una Marca'})
  @ApiParam({name: 'id', description: 'ID de la Marca', example: 'MAR000123'}) 
  @ApiBody({ type: UpdateMarcaDto })
  @ApiOkResponse({description: 'Marca actualizada exitosamente', type: MarcaResponseDto })
  @ApiBadRequestResponse({description: 'Datos inválidos'})
  @ApiNotFoundResponse({description: 'Marca no encontrada'})
  update(@Param('id', new LowercasePipe()) id: string, @Body() updateMarcaDto: UpdateMarcaDto, @GetUser() user: User ) {

    return this.marcasService.update(id, updateMarcaDto, user);

  }

}
