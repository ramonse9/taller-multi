import { Controller, Get, Post, Body, Patch, Param, HttpCode, Query, ClassSerializerInterceptor, UseInterceptors } from '@nestjs/common';
import { VehiculosService } from './vehiculos.service';
import { CreateVehiculoDto } from './dto/create-vehiculo.dto';
import { UpdateVehiculoDto } from './dto/update-vehiculo.dto';
import { ApiBadRequestResponse, ApiBearerAuth, ApiBody, ApiCreatedResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { PaginationQueryDto } from '../DTOs/pagination/pagination-query.dto';
import { VehiculoResponseDto } from './dto/vehiculo-response.dto';
import { VehiculoPaginationDto } from './dto/vehiculo-pagination.dto';
import { LowercasePipe } from '../pipes/lowercase/lowercase.pipe';
import { Auth, GetUser } from '../auth/decorators';
import { User } from '../auth/entities/user.entity';
import { VehiculosTotalResponseDto } from './dto/vehiculos-total.response.dto';
import { EnumRole } from '../commom/enums/general.enum';

@ApiTags('Vehiculos')
@UseInterceptors(ClassSerializerInterceptor)
@ApiUnauthorizedResponse({ description: 'No autorizado' })
@Controller('vehiculos')
export class VehiculosController {
  
  constructor(private readonly vehiculosService: VehiculosService) {}

  @Post()
  @Auth(EnumRole.CAPTURISTA)
  @HttpCode(201)
  @ApiOperation({summary: 'Crear un nuevo Vehiculo'})
  @ApiBody({type: CreateVehiculoDto, description: 'Datos requeridos para crear una Vehiculo'})
  @ApiCreatedResponse({description: 'Vehiculo creada exitosamente', type: VehiculoResponseDto})
  @ApiBadRequestResponse({description: 'Datos inválidos'})
  create(@Body() createVehiculoDto: CreateVehiculoDto, @GetUser() user: User ): Promise<VehiculoResponseDto> {
    return this.vehiculosService.create(createVehiculoDto, user);
  }

  @Get()
  @Auth(EnumRole.CAPTURISTA)
  @ApiOperation({summary: 'Obtener Vehiculos (paginado y filtrado)'})
  @ApiOkResponse({description: 'Listado de Vehiculos', type: VehiculoPaginationDto })
  async getPaginado(
    @Query() query: PaginationQueryDto,
    @GetUser() user: User
  ): Promise<VehiculoPaginationDto> {

    const { page, limit, fSearch } = query 

    const { count, pages, vehiculos } = await this.vehiculosService.getPaginado(page, limit, fSearch, user)

    return {
      page: page,
      limit: limit,
      totalItems: count,
      totalPages: pages,      
      hasNextPage: page < pages,   
      vehiculos: vehiculos
    }

  }

  @Get('/total')
  @Auth(EnumRole.CAPTURISTA)
  @ApiOperation({summary: 'Obtener total de Vehiculos'})
  @ApiOkResponse({description: 'Total de Vehiculos', type: VehiculosTotalResponseDto})
  @ApiNotFoundResponse({description: 'Vehiculos no encontrados'})
  getAll(@GetUser() user: User): Promise<VehiculosTotalResponseDto> {

    return this.vehiculosService.getTotalVehiculos(user);

  }

  @Get(':id')
  @Auth(EnumRole.CAPTURISTA)
  @ApiOperation({summary: 'Obtener una Vehiculo por su ID'})
  @ApiParam({ name: 'id', description: 'ID de la Vehiculo', example: 'EMP000123'})
  @ApiOkResponse({description: 'Vehiculo encontrada', type: VehiculoResponseDto})
  @ApiNotFoundResponse({description: 'Vehiculo no encontrada'})
  getOne(@Param('id', new LowercasePipe()) id: string, @GetUser() user: User): Promise<VehiculoResponseDto> {

    return this.vehiculosService.getOne(id, user);

  }

  @Patch(':id')
  @Auth(EnumRole.CAPTURISTA)
  @ApiOperation({summary: 'Actualizar información de una Vehiculo'})
  @ApiParam({name: 'id', description: 'ID de la Vehiculo', example: 'EMP000123'})
  @ApiBody({type: UpdateVehiculoDto})
  @ApiOkResponse({description: 'Vehiculo actualizada exitosamente', type: VehiculoResponseDto})
  @ApiBadRequestResponse({description: 'Datos inválidos'})
  @ApiNotFoundResponse({description: 'Vehiculo no encontrada'})
  update(@Param('id', new LowercasePipe()) id: string, @Body() updateVehiculoDto: UpdateVehiculoDto, @GetUser() user: User ): Promise<VehiculoResponseDto> {

    return this.vehiculosService.update(id, updateVehiculoDto, user);

  }
}