import { User } from './../auth/entities/user.entity';
import { GetUser } from './../auth/decorators/get-user.decorator';
import { Controller, Get, Post, Body, Patch, Param, Query, HttpCode, UseInterceptors, ClassSerializerInterceptor } from '@nestjs/common';
import { GastosService } from './gastos.service';
import { Auth } from '../auth/decorators/auth.decorator';
import { ApiBadRequestResponse, ApiBearerAuth, ApiBody, ApiCreatedResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { PaginationQueryDto } from './../DTOs/pagination/pagination-query.dto';
import { LowercasePipe } from './../pipes/lowercase/lowercase.pipe';
import { CreateGastoDto } from './dto/create-gasto.dto';
import { CreateGastoMovimientoDto } from './dto/create-gasto-movimiento.dto';
import { GastoCategoriaPaginationDto } from './dto/gasto-categoria-pagination.dto';
import { GastosTotalesPorMesDto } from './dto/gastos-totales-por-mes.dto';
import { EnumRole } from '../commom/enums/general.enum';
import { GastoMovimientoResponseDto } from './dto/gasto-movimiento-response.dto';
import { mapGastoCategoriaToResponseDto, mapGastoMovimientoToResponseDto, mapGastoToResponseDto } from './mappers/gasto.mappers';
import { GastoResponseDto } from './dto/gasto-response.dto';
import { GastoPaginationDto } from './dto/gasto-pagination.dto';
import { GastoMovimientoPaginationDto } from './dto/gasto-movimiento-pagination.dto';
import { UpdateGastoDto } from './dto/update-gasto-concepto.dto';
import { GastoConMovimientoPorMesDto } from './dto/gasto-con-movimiento-por-mes.dto';

@ApiTags('Gastos')
@UseInterceptors(ClassSerializerInterceptor)
@ApiUnauthorizedResponse({ description: 'No autorizado' })
@Controller('gastos')
export class GastosController {
  constructor(private readonly gastosService: GastosService) {}


  @Post()
  @Auth(EnumRole.ADMIN)
  @HttpCode(201)
  @ApiOperation({summary: 'Registrar un Gasto'})
  @ApiBody({type: CreateGastoDto, description: 'Datos requeridos para registrar un nuevo Gasto'})
  @ApiCreatedResponse({type: GastoResponseDto, description: 'Gasto creado exitosamente'})
  async createGasto(@Body() createGastoDto: CreateGastoDto, @GetUser() user):Promise<GastoResponseDto>{
    
    const gasto = await this.gastosService.createGasto( createGastoDto, user );

    return mapGastoToResponseDto( gasto );

  }

  @Get()
  @Auth(EnumRole.ADMIN)
  @ApiOperation({summary: 'Obtener de Gastos (paginado y filtrado)'})
  @ApiOkResponse({description: 'Listado de Gastos', type: GastoPaginationDto})
  async getPaginadoGastos(
        @Query() query: PaginationQueryDto,
        //@Res({ passthrough: true }) res: Response,
        @GetUser() user: User
  ): Promise<GastoPaginationDto> {

    const { page, limit, fSearch } = query;
    const { count, pages, gastos } = await this.gastosService.getPaginadoGastos( page, limit, fSearch, user )

    return {
      page: page,
      limit: limit,
      totalItems: count,
      totalPages: pages,
      hasNextPage: page < pages,
      gastos: gastos.map( mapGastoToResponseDto )
    }
      
  }

  @Post('/movimientos')
  @Auth(EnumRole.ADMIN)
  @HttpCode(201)
  @ApiOperation({summary: 'Registrar un Movimiento de Gasto'})
  @ApiBody({type: CreateGastoMovimientoDto, description: 'Datos requeridos para registrar un nuevo Movimiento de Gasto'})
  @ApiCreatedResponse({type: GastoMovimientoResponseDto, description: 'Movimiento de Gasto creado exitosamente'})
  async createGastoMovimiento(@Body() createGastoMovimientoDto: CreateGastoMovimientoDto, @GetUser() user):Promise<GastoMovimientoResponseDto>{

    const gastoMovimiento = await this.gastosService.createGastoMovimiento( createGastoMovimientoDto, user );

    return mapGastoMovimientoToResponseDto( gastoMovimiento );

  }

  @Get('/movimientos')
  @Auth(EnumRole.ADMIN)
  @ApiOperation({summary: 'Obtener Movimientos de Gastos (paginado y filtrado)'})
  @ApiOkResponse({description: 'Listado de Movimientos de Gastos', type: GastoMovimientoPaginationDto})
  async getPaginadoGastosMovimientos(
        @Query() query: PaginationQueryDto,
        //@Res({ passthrough: true }) res: Response,
        @GetUser() user: User
  ): Promise<GastoMovimientoPaginationDto> {

    const { page, limit, fSearch } = query;
    const { count, pages, gastosMovimientos } = await this.gastosService.getPaginadoGastosMovimientos( page, limit, fSearch, user )

    return {
      page: page,
      limit: limit,
      totalItems: count,
      totalPages: pages,
      hasNextPage: page < pages,
      gastosMovimientos: gastosMovimientos.map( mapGastoMovimientoToResponseDto )
    }
      
  }
  


  /*
  @Get('/conceptos/gastos6meses')
  @Auth(EnumRole.ADMIN)
  @ApiOperation({summary: 'Obtener Conceptos de Gastos (paginado y filtrado)'})
  @ApiOkResponse({description: 'Listado de Conceptos de Gastos', type: GastosTotalesPorMesDto, isArray: true})
  async getTotalesGastosUltimos6Meses(
        //@Res({ passthrough: true }) res: Response,
        @GetUser() user: User
  ): Promise<GastosTotalesPorMesDto[]> {
    
    const totalesPorMes = await this.gastosService.getTotalesGastosUltimos6Meses( user )

    return totalesPorMes
      
  }*/

  
  @Get('/movimientos/por-mes')
  @Auth(EnumRole.ADMIN)
  @ApiOperation({ summary: 'Obtener Total de Gastos con sus Movimientos de un mes específico' })
  //@ApiOkResponse({ 
  //  description: 'Listado Total de Movimientos de Gastos por mes', 
  //  type: GastoConMovimientosPorMesDto
  //})
  async getGastosConMovimientosPorMes(
    @Query() query: GastoConMovimientoPorMesDto,
    @GetUser() user: User
  ){
  //): Promise<GastoConMovimientoPorMesDto> {
    
    const { mes, anio, fSearch } = query;    

    const { totalGastadoMes, gastos } = await this.gastosService
      .getGastosConMovimientosPorMes(
        fSearch, 
        user,
        anio,
        mes,
      );

    return {
      totalGastadoMes,
      gastos

      //gastos: gastosConceptos.map(mapGastoConceptoToResponseWithGastosDto)
    };
  }

  @Get('/categorias')
  @Auth(EnumRole.ADMIN)
  @ApiOperation({summary: 'Obtener Categorías de Gastos (paginado y filtrado)'})
  @ApiOkResponse({description: 'Listado de Categorías de Gastos', type: GastoCategoriaPaginationDto})
  async getPaginadoGastosCategorias(
        @Query() query: PaginationQueryDto,
        //@Res({ passthrough: true }) res: Response,
        @GetUser() user: User
  ): Promise<GastoCategoriaPaginationDto> {

    const { page, limit, fSearch } = query;
    const { count, pages, gastosCategorias } = await this.gastosService.getPaginadoGastosCategorias( page, limit, fSearch, user )

    return {
      page: page,
      limit: limit,
      totalItems: count,
      totalPages: pages,
      hasNextPage: page < pages,
      gastosCategorias: gastosCategorias.map( mapGastoCategoriaToResponseDto )
    }
      
  }

  @Get('movimientos/:id')
  @Auth(EnumRole.ADMIN)
  @ApiOperation({summary: 'Obtener un Movimiento de Gasto por su ID'})
  @ApiParam({name: 'id', description: 'ID del Movimiento del Gasto', example: 'GAM000123'})
  @ApiOkResponse({ type: GastoMovimientoResponseDto, description: 'Movimiento de Gasto encontrado'})
  @ApiNotFoundResponse({description: 'Movimiento de Gasto no encontrado'})
  async getOneGastoMovimiento(@Param('id', new LowercasePipe()) id: string, @GetUser() user: User
  ): Promise<GastoMovimientoResponseDto> {  

    const gastoMovimiento = await this.gastosService.getOneGastoMovimiento(id, user);
    
    return mapGastoMovimientoToResponseDto( gastoMovimiento );
  }

  
  @Get(':id')
  @Auth(EnumRole.ADMIN)
  @ApiOperation({summary: 'Obtener un Gasto por su ID'})
  @ApiParam({name: 'id', description: 'ID del Gasto', example: 'GAS000123'})
  @ApiOkResponse({ type: GastoResponseDto, description: 'Gasto encontrado'})
  @ApiNotFoundResponse({description: 'Gasto no encontrado'})
  async getOneGasto(@Param('id', new LowercasePipe()) id: string, @GetUser() user: User
  ): Promise<GastoResponseDto> {  

    const gasto = await this.gastosService.getOneGasto(id, user);
    
    return mapGastoToResponseDto( gasto );
  }
  
  @Patch(':id')  
  @Auth(EnumRole.ADMIN)
  @ApiOperation({summary: 'Actualizar información del Gasto'})
  @ApiParam({name: 'id', description: 'ID del Gasto', example: 'GAS000123'})
  @ApiBody({type: UpdateGastoDto, description: 'Datos requeridos para actualizar un Gasto'})
  @ApiOkResponse({type: GastoResponseDto, description: 'Gasto actualizado exitosamente'})
  @ApiBadRequestResponse({description: 'Datos inválidos'})
  @ApiNotFoundResponse({description: 'Gasto no encontrado'})
  @ApiOkResponse({
    description: 'Gasto actualizado exitosamente',
    schema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          example: 'gas000123'
        }
      }
    }
  })
  async updateGasto(
        @Param('id', new LowercasePipe()) id: string, 
        //@Body(new ForbidFieldsPipe(['id_sat_producto_servicio'])) updateProductoServicioDto: UpdateProductoServicioDto,
        @Body() updateGastoDto: UpdateGastoDto,
        @GetUser() user: User
      ) {
    
    const gasto = await this.gastosService.updateGasto(id, updateGastoDto, user);
    return gasto;

  }

  
  /*
  @Get('/conceptos/:id')
  @Auth(EnumRole.ADMIN)
  @ApiOperation({summary: 'Obtener un Gasto Concepto por su ID'})
  @ApiParam({name: 'id', description: 'ID del Gasto Concepto', example: 'GAC000123'})
  @ApiOkResponse({ type: GastoConceptoResponseDto, description: 'Gasto Concepto encontrado'})
  @ApiNotFoundResponse({description: 'Gasto Concepto no encontrado'})
  async getOneGastoConcepto(@Param('id', new LowercasePipe()) id: string, @GetUser() user: User
  ): Promise<GastoConceptoResponseDto> {  

    const gastoConcepto = await this.gastosService.getOneGastoConcepto(id, user);
    
    return mapGastoConceptoToResponseDto( gastoConcepto );
  }*/  

  /*
  @Patch('/conceptos/:id')  
  @Auth(EnumRole.ADMIN)
  @ApiOperation({summary: 'Actualizar información del Gasto Concepto'})
  @ApiParam({name: 'id', description: 'ID del Gasto Concepto', example: 'GAC000123'})
  @ApiBody({type: UpdateGastoConceptoDto, description: 'Datos requeridos para actualizar un Gasto Concepto'})
  @ApiOkResponse({type: GastoConceptoResponseDto, description: 'Gasto Concepto actualizado exitosamente'})
  @ApiBadRequestResponse({description: 'Datos inválidos'})
  @ApiNotFoundResponse({description: 'Gasto Concepto no encontrado'})
  @ApiOkResponse({
    description: 'Gasto Concepto actualizado exitosamente',
    schema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          example: 'gac000123'
        }
      }
    }
  })
  async updateGastoConcepto(
        @Param('id', new LowercasePipe()) id: string, 
        //@Body(new ForbidFieldsPipe(['id_sat_producto_servicio'])) updateProductoServicioDto: UpdateProductoServicioDto,
        @Body() updateGastoConceptoDto: UpdateGastoConceptoDto,
        @GetUser() user: User
      ) {

    const gastoConcepto = await this.gastosService.updateGastoConcepto(id, updateGastoConceptoDto, user);
    return gastoConcepto;

  }*/


}
