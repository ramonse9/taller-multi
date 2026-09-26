import { Controller, Get, Post, Body, Param, HttpCode, Query, Patch, UseInterceptors, ClassSerializerInterceptor } from '@nestjs/common';
import { ClientesService } from './clientes.service';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { ApiBadRequestResponse, ApiBearerAuth, ApiBody, ApiCreatedResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { ClienteResponseDto } from './dto/cliente-response.dto';
import { PaginationQueryDto } from '../DTOs/pagination/pagination-query.dto';
import { ClientePaginationDto } from './dto/cliente-pagination.dto';
import { LowercasePipe } from '../pipes/lowercase/lowercase.pipe';
import { Auth, GetUser } from '../auth/decorators';
import { User } from '../auth/entities/user.entity';
import { ClientesTotalResponseDto } from './dto/clientes-total-response.dto';
import { EnumRole } from '../commom/enums/general.enum';

@ApiTags('Clientes')
@UseInterceptors(ClassSerializerInterceptor)
@ApiUnauthorizedResponse({ description: 'No autorizado' })
@Controller('clientes')
export class ClientesController {
  constructor(private readonly clientesService: ClientesService) {}
  
  @Post()
  @Auth(EnumRole.CAPTURISTA)
  @HttpCode(201)
  @ApiOperation({summary: 'Crear un nuevo Cliente'})
  @ApiBody({type: CreateClienteDto, description: 'Datos requeridos para crear un Cliente'})
  @ApiCreatedResponse({description: 'Cliente creado exitosamente', type: ClienteResponseDto})
  @ApiBadRequestResponse({description: 'Datos inválidos'})
  create(@Body() createClienteDto: CreateClienteDto, @GetUser() user: User): Promise<ClienteResponseDto> {
    return this.clientesService.create(createClienteDto, user);
  }

  @Get()
  @Auth(EnumRole.CAPTURISTA)
  @ApiOperation({summary: 'Obtener Clientes (paginado y filtrado)'})
  @ApiOkResponse({description: 'Listado de Clientes', type: ClientePaginationDto })  
  async getPaginado(
    @Query() query: PaginationQueryDto,
    @GetUser() user: User
  ): Promise<ClientePaginationDto> {

    const { page, limit, fSearch } = query;
    const { count, pages, clientes }  = await this.clientesService.getPaginado(page, limit, fSearch, user)
    
    return {
      page: page,
      limit: limit,
      totalItems: count,
      totalPages: pages,
      hasNextPage: page < pages,      
      clientes: clientes,
    }

  }

  @Get('/total')
  @Auth(EnumRole.ADMIN)
  @ApiOperation({summary: 'Obtener total Clientes'})
  @ApiOkResponse({description: 'Total de Clientes', type: ClientesTotalResponseDto})
  @ApiNotFoundResponse({description: 'Clientes no encontrados'})
  getAll(@GetUser() user: User): Promise<ClientesTotalResponseDto> {

    return this.clientesService.getTotalClientes(user);

  }

  @Get(':id')
  @Auth(EnumRole.CAPTURISTA)
  @ApiOperation({summary: 'Obtener un Cliente por su ID'})
  @ApiParam({ name: 'id', description: 'ID del Cliente', example: 'CLI000123'})
  @ApiOkResponse({description: 'Cliente encontrado', type: ClienteResponseDto})
  @ApiNotFoundResponse({description: 'Cliente no encontrado'})
  getOne(@Param('id', new LowercasePipe()) id: string, @GetUser() user: User): Promise<ClienteResponseDto> {

    return this.clientesService.getOne(id, user);

  }

  @Patch(':id')
  @Auth(EnumRole.CAPTURISTA)
  @ApiOperation({summary: 'Actualizar información de un Cliente'})
  @ApiParam({name: 'id', description: 'ID del Cliente', example: 'CLI000123'})
  @ApiBody({type: UpdateClienteDto})
  @ApiOkResponse({description: 'Cliente actualizado exitosamente', type: ClienteResponseDto})
  @ApiBadRequestResponse({description: 'Datos inválidos'})
  @ApiNotFoundResponse({description: 'Cliente no encontrado'})
  update(@Param('id', new LowercasePipe()) id: string, @Body() updateClienteDto: UpdateClienteDto, @GetUser() user: User): Promise<ClienteResponseDto> {

    return this.clientesService.update(id, updateClienteDto, user);

  }

}