import { Controller, Get, Post, Body, Patch, Param, Query, HttpCode, ClassSerializerInterceptor, UseInterceptors } from '@nestjs/common';
import { EmpresasService } from './empresas.service';
import { CreateEmpresaDto } from './dto/create-empresa.dto';
import { UpdateEmpresaDto } from './dto/update-empresa.dto';
import { PaginationQueryDto } from '../DTOs/pagination/pagination-query.dto';
import { ApiBadRequestResponse, ApiBearerAuth, ApiBody, ApiCreatedResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { EmpresaResponseDto } from './dto/empresa-response.dto';
import { EmpresaPaginationDto } from './dto/empresa-pagination.dto';
import { LowercasePipe } from '../pipes/lowercase/lowercase.pipe';
import { Auth, GetUser } from '../auth/decorators';
import { User } from '../auth/entities/user.entity';
import { EmpresasTotalResponseDto } from './dto/empresas-total.response.dto';
import { EnumRole } from '../commom/enums/general.enum';

@ApiTags('Empresas')
@UseInterceptors(ClassSerializerInterceptor)
@ApiUnauthorizedResponse({ description: 'No autorizado' })
@Controller('empresas')
export class EmpresasController {
  constructor(private readonly empresasService: EmpresasService) {}

  @Post()
  @Auth(EnumRole.ADMIN)
  @HttpCode(201)
  @ApiOperation({summary: 'Crear una nueva Empresa'})
  @ApiBody({type: CreateEmpresaDto, description: 'Datos requeridos para crear una Empresa'})
  @ApiCreatedResponse({description: 'Empresa creada exitosamente', type: EmpresaResponseDto})
  @ApiBadRequestResponse({description: 'Datos inválidos'})
  create(@Body() createEmpresaDto: CreateEmpresaDto, @GetUser() user: User): Promise<EmpresaResponseDto> {
    return this.empresasService.create(createEmpresaDto, user);
  }

  @Get()
  @Auth(EnumRole.ADMIN)
  @ApiOperation({summary: 'Obtener Empresas (paginado y filtrado)'})
  @ApiOkResponse({description: 'Listado de Empresas', type: EmpresaPaginationDto })
  async getPaginado(
    @Query() query: PaginationQueryDto,
    @GetUser() user: User
  ): Promise<EmpresaPaginationDto> {

    const { page, limit, fSearch } = query 
    const { count, pages, empresas } = await this.empresasService.getPaginado(page, limit, fSearch, user);

    return {
      page: page,
      limit: limit,
      totalItems: count,
      totalPages: pages,
      hasNextPage: page < pages,      
      empresas: empresas,
    }

  }

  @Get('/total')
  @Auth(EnumRole.ADMIN)
  @ApiOperation({summary: 'Obtener total Empresas'})
  @ApiOkResponse({description: 'Total de Empresas', type: EmpresasTotalResponseDto})
  @ApiNotFoundResponse({description: 'Empresas no encontradas'})
  getAll(@GetUser() user: User): Promise<EmpresasTotalResponseDto> {

    return this.empresasService.getTotalEmpresas(user);

  }

  @Get(':id')
  @Auth(EnumRole.ADMIN)
  @ApiOperation({summary: 'Obtener una Empresa por su ID'})
  @ApiParam({ name: 'id', description: 'ID de la Empresa', example: 'EMP000123'})
  @ApiOkResponse({description: 'Empresa encontrada', type: EmpresaResponseDto})
  @ApiNotFoundResponse({description: 'Empresa no encontrada'})
  getOne(@Param('id', new LowercasePipe()) id: string, @GetUser() user: User): Promise<EmpresaResponseDto> {

    return this.empresasService.getOne(id, user);

  }

  @Patch(':id')
  @Auth(EnumRole.ADMIN)
  @ApiOperation({summary: 'Actualizar información de una Empresa'})
  @ApiParam({name: 'id', description: 'ID de la Empresa', example: 'EMP000123'})
  @ApiBody({type: UpdateEmpresaDto})
  @ApiOkResponse({description: 'Empresa actualizada exitosamente', type: EmpresaResponseDto})
  @ApiBadRequestResponse({description: 'Datos inválidos'})
  @ApiNotFoundResponse({description: 'Empresa no encontrada'})
  update(@Param('id', new LowercasePipe()) id: string, @Body() updateEmpresaDto: UpdateEmpresaDto, @GetUser() user: User): Promise<EmpresaResponseDto> {

    return this.empresasService.update(id, updateEmpresaDto, user);

  }
}