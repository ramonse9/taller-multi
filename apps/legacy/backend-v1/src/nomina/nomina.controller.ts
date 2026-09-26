import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, Query, UseInterceptors, ClassSerializerInterceptor } from '@nestjs/common';
import { NominaService } from './nomina.service';
import { CreateNominaPeriodoDto } from './dto/create-nomina-periodo.dto';
import { Auth, GetUser } from './../auth/decorators';
import { ApiBearerAuth, ApiBody, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { EnumNominaPeriodicidad, EnumRole } from './../commom/enums/general.enum';
import { User } from './../auth/entities/user.entity';
import { NominaPeriodosPorMesDto } from './dto/nomina-periodos-por-mes.dto';
import { NominaPeriodoResponseDto } from './dto/nomina-periodo-response.dto';
import { CreateNominaMovimientoDto } from './dto/create-nomina-movimiento.dto';
import { NominaPeriodoMovimientosDto } from './dto/nomina-periodo-movimientos.dto';
import { NominaPeriodosMovimientosDto } from './dto/nomina-periodos-movimientos.dto';
import { NominaTotalesPorMesDto } from './dto/nomina-totales-por-mes.dto';

@ApiTags('Nomina')
@UseInterceptors(ClassSerializerInterceptor)
@ApiUnauthorizedResponse({ description: 'No autorizado' })
@Controller('nomina')
export class NominaController {
  constructor(private readonly nominaService: NominaService) {}

  @Post("/periodos")
  @Auth(EnumRole.SUPER)
  @HttpCode(201)
  @ApiOperation({summary: 'Crear los periodos del año'})
  @ApiBody({type: CreateNominaPeriodoDto, description: 'Datos requeridos para crear una Orden' })
  @ApiCreatedResponse({ 
    description: 'Periodos creados exitosamente',
    schema: {
      type: 'object',
      properties: {
        año: {
          type: 'string',
          example: '2026'
        },
        periodicidad: {
          type: 'string',
          enum: Object.values(EnumNominaPeriodicidad),
          example: EnumNominaPeriodicidad.SEMANAL
        },
      }
    }
  })
  createNominaPeriodos(@Body() createNominaPeriodoDto: CreateNominaPeriodoDto, @GetUser() user: User ) {
    return this.nominaService.createNominaPeriodos(createNominaPeriodoDto, user);
  }

  @Post("/movimientos")
  @Auth(EnumRole.ADMIN)
  @HttpCode(201)
  @ApiOperation({summary: 'Crear un Movimiento de Nómina'})
  @ApiBody({type: CreateNominaMovimientoDto, description: 'Datos requeridos para crear un Movimiento de Nómina' })
  @ApiCreatedResponse({ 
    description: 'Movimiento creado exitosamente',
    schema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          example: '123'
        },
      }
    }
  })
  createNominaMovimiento(@Body() createNominaMovimientoDto: CreateNominaMovimientoDto, @GetUser() user: User ) {
    return this.nominaService.createNominaMovimiento(createNominaMovimientoDto, user);
  }

  @Get('/movimientos/nomina6meses')
  @Auth(EnumRole.ADMIN)
  @ApiOperation({summary: 'Obtener Nomina últimos 6 meses'})
  @ApiOkResponse({description: 'Listado de Nomina', type: NominaTotalesPorMesDto, isArray: true})
  async getTotalesGastosUltimos6Meses(
        //@Res({ passthrough: true }) res: Response,
        @GetUser() user: User
  ): Promise<NominaTotalesPorMesDto[]> {
    
    const totalesPorMes = await this.nominaService.getTotalesMovimientosUltimos6Meses( user )

    return totalesPorMes
      
  }
  
  @Get("/periodos")
  @Auth(EnumRole.ADMIN)
  @HttpCode(201)
  @ApiOperation({summary: 'Obtener Periodos por Mes y Año'})
  @ApiOkResponse({description: 'Listado de Periodos por Mes y Año', type: NominaPeriodoResponseDto})
  async getNominaPeriodosMesAnio(
    @Query() query: NominaPeriodosPorMesDto,
    @GetUser() user: User,
  ) {
    //: Promise<NominaPeriodoResponseDto>

    const { anio, mes } = query;

    const { granTotalMes, periodos } = await this.nominaService.getNominaPeriodosMes  (mes, anio, user);

    return {
      granTotalMes,
      nominaPeriodos: periodos
    }    
    
  }

  //@ApiOkResponse({ 
  //  description: 'Listado Total de Empleados con movimientos del mes', 
  //  type: any
  //})

  @Get('/periodo/movimientos')
  @Auth(EnumRole.ADMIN)
  @ApiOperation({ summary: 'Obtener Total de Empleados de sus movimientos en un periodo' })
  async getPeriodoMovimientos(
    @Query() query: NominaPeriodoMovimientosDto,
    @GetUser() user: User
  ) {
    
    const { id_periodo } = query;

    //const { count, gastosConceptos } = await this.nominaService
    //  .getMovimientosPeriodosPorMes(
    //    user,
    //    id_periodos
    //  );

    /*
    const { granTotalMes, cantidadPeriodos, nominaPeriodos } =
       await this.nominaService.getNominaPeriodosMovimientosMes(
        user, id_periodo
       )*/


    const { idPeriodo, empleadosConMovimientos } =
       await this.nominaService.getPeriodoMovimientos(
        user, id_periodo
       )

    //return {
    //  totalItems: count,
    //  nominaEmpleadosConPagos: gastosConceptos.map(mapGastoConceptoToResponseWithGastosDto)
    //};

    /*return {
      granTotalMes,
      cantidadPeriodos,
      nominaPeriodos
    };*/

    return {
      idPeriodo, empleadosConMovimientos
    }
  }

  @Get('/periodos/movimientos')
  @Auth(EnumRole.ADMIN)
  @ApiOperation({ summary: 'Obtener Total de Empleados de sus movimientos en varios periodos' })
  async getPeriodosMovimientos(
    @Query() query: NominaPeriodosMovimientosDto,
    @GetUser() user: User
  ) {
    
    const { ids_periodos } = query;

    //const { count, gastosConceptos } = await this.nominaService
    //  .getMovimientosPeriodosPorMes(
    //    user,
    //    id_periodos
    //  );

    /*
    const { granTotalMes, cantidadPeriodos, nominaPeriodos } =
       await this.nominaService.getNominaPeriodosMovimientosMes(
        user, id_periodo
       )*/


    /*const { idPeriodo, empleados } =
       await this.nominaService.getmovimientosPorPeriodos(
        user, id_periodos
       )*/

    const respuesta =
       await this.nominaService.getPeriodosMovimientos(
        user, ids_periodos
       )
    

    //return {
    //  totalItems: count,
    //  nominaEmpleadosConPagos: gastosConceptos.map(mapGastoConceptoToResponseWithGastosDto)
    //};

    /*return {
      granTotalMes,
      cantidadPeriodos,
      nominaPeriodos
    };*/

    return respuesta

    //return {
    //  idPeriodo, empleados
    //}
  }

}
