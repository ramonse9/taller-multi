import { SatPaisResponseDto } from './../productos-servicios/dto/sat-pais-response.dto';
import { SatPaisPaginationDto } from './../productos-servicios/dto/sat-pais-pagination.dto';
import { SatImpuestoPorcentajeResponseDto } from './../productos-servicios/dto/sat-impuesto-porcentaje-response.dto';
import { SatImpuestoPorcentajePaginationDto } from './../productos-servicios/dto/sat-impuesto-porcentaje-pagination.dto';
import { SatProductoServicioResponseDto } from './../productos-servicios/dto/sat-producto-servicio-response.dto';
import { SatRegimenFiscalPaginationDto } from './../productos-servicios/dto/sat-regimen-fiscal-pagination.dto';
import { SatRegimenFiscalResponseDto } from './../productos-servicios/dto/sat-regimen-fiscal-response.dto';
import { SatUsoCFDIPaginationDto } from './../productos-servicios/dto/sat-uso-cfdi-pagination.dto';
import { SatUsoCFDIResponseDto } from './../productos-servicios/dto/sat-uso-cfdi-response.dto';
import { SatTipoComprobantePaginationDto } from './../productos-servicios/dto/sat-tipo-comprobante-pagination.dto';
import { SatTipoComprobanteResponseDto } from './../productos-servicios/dto/sat-tipo-comprobante-response.dto';
import { SatMetodoPagoPaginationDto } from './../productos-servicios/dto/sat-metodo-pago-pagination.dto';
import { SatMetodoPagoResponseDto } from './../productos-servicios/dto/sat-metodo-pago-response.dto';
import { SatFormaPagoPaginationDto } from './../productos-servicios/dto/sat-forma-pago-pagination.dto';
import { SatFormaPagoResponseDto } from './../productos-servicios/dto/sat-forma-pago-response.dto';
import { SatImpuestoResponseDto } from './../productos-servicios/dto/sat-impuesto-response.dto';
import { SatImpuestoPaginationDto } from './../productos-servicios/dto/sat-impuesto-pagination.dto';
import { SatProductoServicioPaginationDto } from './../productos-servicios/dto/sat-producto-servicio-pagination.dto';
import { User } from './../auth/entities/user.entity';
import { PaginationQueryDto } from './../DTOs/pagination/pagination-query.dto';
import { GetUser } from './../auth/decorators/get-user.decorator';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { Controller, Get, Post, Body, Patch, Param, Delete, Query, BadRequestException, UseInterceptors, ClassSerializerInterceptor } from '@nestjs/common';
import { SatService } from './sat.service';
import { CreateSatDto } from './dto/create-sat.dto';
import { UpdateSatDto } from './dto/update-sat.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { SatCancelacionMotivoResponseDto } from './../productos-servicios/dto/sat-cancelacion-motivo-response.dto';
import { SatCancelacionMotivoPaginationDto } from './../productos-servicios/dto/sat-cancelacion-motivo-pagination.dto';
import { EnumRole } from '../commom/enums/general.enum';
import { TipoPersonaPaginationQueryDto } from './dto/tipo-persona-pagination-query.dto';
import { PaginationQueryProductosServiciosDto } from './dto/pagination-query-productos-servicios.dto';

@ApiTags('Sat')
@UseInterceptors(ClassSerializerInterceptor)
@ApiUnauthorizedResponse({ description: 'No autorizado' })
@Controller('sat')
export class SatController {
  
  constructor(private readonly satService: SatService) {}  
  
  @Get('/productosservicios')
  @Auth(EnumRole.ADMIN)
  @ApiOperation({summary: 'Obtener Catalogo Productos y Servicios (paginado y filtrado)'})  
  async getCatalogoProductosServicios(
    @Query() query: PaginationQueryProductosServiciosDto,
    @GetUser() user: User
  ): Promise<SatProductoServicioPaginationDto> {

    const { page = 1, limit = 5, fSearch, tipo } = query;

    const { count, pages, satProductosServicios } = await this.satService.getPaginadoSatProductosServicios( page, limit, fSearch, tipo, user );

    return {
      page: page,
      limit: limit,
      totalItems: count,
      totalPages: pages,
      hasNextPage: page < pages,
      satProductosServicios: satProductosServicios as SatProductoServicioResponseDto[]
    }
    
  }
  
  @Get('/regimenesfiscales')
  @Auth(EnumRole.ADMIN)
  @ApiOperation({summary: 'Obtener Catalogo Regimenes Fiscales por Tipo Persona (filtrado)'})
  async getCatalogoRegimenesFiscalesTipoPersona(
    @Query() query: TipoPersonaPaginationQueryDto,
    @GetUser() user: User,
  ): Promise<SatRegimenFiscalPaginationDto> {
  
    //if( tipoPersona != 'fisica' && tipoPersona != 'moral' ){
    //  throw new BadRequestException('Debes definir el Tipo de Persona')
    //}

    const { page, limit, fSearch, tipoPersona } = query;
    const { count, pages, satRegimenesFiscales } = await this.satService.getPaginadoSatRegimenesFiscalesByTipoPersona( page, limit, fSearch, tipoPersona, user );

    return {
      page: page,
      limit: limit,
      totalItems: count,
      totalPages: pages,
      hasNextPage: page < pages,  
      satRegimenesFiscales: satRegimenesFiscales as SatRegimenFiscalResponseDto[]
    }    

  }
  
  @Get('/usocfdi')
  @Auth(EnumRole.ADMIN)
  @ApiOperation({summary: 'Obtener Catalogo Uso CFDI por Tipo Persona y Regimen Fiscal (filtrado)'})
  async getCatalogoUsoCfdiTipoPersonaRegimenFiscal(
    @Query() query: PaginationQueryDto,    
    @Query('claveSatRegimenFiscal') claveSatRegimenFiscal: string,
    @GetUser() user: User  
  ): Promise<SatUsoCFDIPaginationDto> {    

    if( claveSatRegimenFiscal === '' ){
      throw new BadRequestException('El regimenFiscal debe de indicarse');
    } 

    const { page, limit, fSearch } = query;

    const { count, pages, satUsoCFDI } = await this.satService.getPaginadoSatUsoCfdiByTipoPersonaRegimenFiscal( page, limit, fSearch, claveSatRegimenFiscal, user );

    return {
      page: page,
      limit: limit,
      totalItems: count,
      totalPages: pages,
      hasNextPage: page < pages,  
      satUsosCFDIs: satUsoCFDI as SatUsoCFDIResponseDto[]
    }
  }

  @Get('/tiposcomprobantes')
  @Auth(EnumRole.ADMIN)
  @ApiOperation({summary: 'Obtener Catalogo Tipo de Comprobantes'})
  async getCatalogoTiposDeComprobantes(
    @Query() query: PaginationQueryDto,
    @GetUser() user: User  
  ): Promise<SatTipoComprobantePaginationDto> {

    const { page, limit, fSearch } = query;
    const { count, pages, satTiposComprobantes } = await this.satService.getPaginadoSatTipoComprobante( page, limit, fSearch, user );

    return {
     page: page,
      limit: limit,
      totalItems: count,
      totalPages: pages,
      hasNextPage: page < pages,  
      satTiposComprobantes: satTiposComprobantes as SatTipoComprobanteResponseDto[]
    }

  }  

  @Get('/metodospagos')
  @Auth(EnumRole.ADMIN)
  @ApiOperation({summary: 'Obtener Catalogo Métodos Pagos'})
  async getCatalogoMetodosPagos(
    @Query() query: PaginationQueryDto,
    @GetUser() user: User  
  ): Promise<SatMetodoPagoPaginationDto> {

    const { page, limit, fSearch } = query;
    const { count, pages, satMetodosPagos } = await this.satService.getPaginadoSatMetodoPago( page, limit, fSearch, user );

    return {
      page: page,
      limit: limit,
      totalItems: count,
      totalPages: pages,
      hasNextPage: page < pages,  
      satMetodosPagos: satMetodosPagos as SatMetodoPagoResponseDto[]
    }

  }
  
  @Get('/formaspagos')
  @Auth(EnumRole.ADMIN)
  @ApiOperation({summary: 'Obtener Catalogo Formas Pagos'})
  async getCatalogoFormasPagos(
    @Query() query: PaginationQueryDto,
    @GetUser() user: User  
  ): Promise<SatFormaPagoPaginationDto> {

    const { page, limit, fSearch } = query;
    const { count, pages, satFormasPagos } = await this.satService.getPaginadoSatFormaPago( page, limit, fSearch, user );

    return {
      page: page,
      limit: limit,
      totalItems: count,
      totalPages: pages,
      hasNextPage: page < pages,  
      satFormasPagos: satFormasPagos as SatFormaPagoResponseDto[]
    }

  }
    
  @Get('/impuestos')
  @Auth(EnumRole.ADMIN)
  @ApiOperation({summary: 'Obtener Catalogo Impuestos'})
  async getCatalogoImpuestos(
    @Query() query: PaginationQueryDto,    
    @GetUser() user: User  
  ): Promise<SatImpuestoPaginationDto> {

    const { page, limit, fSearch } = query;
    const { count, pages, satImpuestos } = await this.satService.getPaginadoSatImpuesto( page, limit, fSearch, user );

    return {
      page: page,
      limit: limit,
      totalItems: count,
      totalPages: pages,
      hasNextPage: page < pages,  
      satImpuestos: satImpuestos as SatImpuestoResponseDto[]
    }

  }

  @Get('/impuestosporcentajes')
  @Auth(EnumRole.ADMIN)
  @ApiOperation({summary: 'Obtener Catalogo Impuestos'})
  async getCatalogoImpuestosPorcentajes(
    @Query() query: PaginationQueryDto,    
    @GetUser() user: User  
  ): Promise<SatImpuestoPorcentajePaginationDto> {

    const { page, limit, fSearch } = query;
    const { count, pages, satImpuestosPorcentajes } = await this.satService.getPaginadoSatImpuestoPorcentaje( page, limit, fSearch, user );

    return {
      page: page,
      limit: limit,
      totalItems: count,
      totalPages: pages,
      hasNextPage: page < pages,  
      satImpuestosPorcentajes: satImpuestosPorcentajes as SatImpuestoPorcentajeResponseDto[]
    }

  }
  
  @Get('/pais')
  @Auth(EnumRole.ADMIN)
  @ApiOperation({summary: 'Obtener Catalogo Paises'})
  async getCatalogoPaises(
    @Query() query: PaginationQueryDto,
    @GetUser() user: User  
  ): Promise<SatPaisPaginationDto> {

    const { page, limit, fSearch } = query;
    const { count, pages, satPaises } = await this.satService.getPaginadoSatPais( page, limit, fSearch, user );

    return {
      page: page,
      limit: limit,
      totalItems: count,
      totalPages: pages,
      hasNextPage: page < pages,  
      satPaises: satPaises as SatPaisResponseDto[]
    }

  }

  @Get('/cancelacionesmotivos')
  @Auth(EnumRole.ADMIN)
  @ApiOperation({summary: 'Obtener Catálogo Cancelación Motivos'})
  async getCatalogoCancelacionMotivos(
    @Query() query: PaginationQueryDto,
    @GetUser() user: User,
  ): Promise<SatCancelacionMotivoPaginationDto>{

    const { page, limit, fSearch } = query;
    const { count, pages, satCancelacionesMotivos } = await this.satService.getPaginadoSatCancelacionMotivo( page, limit, fSearch, user)

    return { 
      page: page,
      limit: limit,
      totalItems: count,
      totalPages: pages,
      hasNextPage: page < pages,  
      satCancelacionesMotivos: satCancelacionesMotivos as SatCancelacionMotivoResponseDto[]
    }

  }

}
