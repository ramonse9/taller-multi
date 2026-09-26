import { CalcularImpuestosDto } from './dto/calcular-impuestos-dto';
import { Controller, Get, Post, Body, Param, HttpCode, Query, ClassSerializerInterceptor, UseInterceptors } from '@nestjs/common';
import { FacturasService } from './facturas.service';
import { CreateFacturaDto } from './dto/create-factura.dto';
import { ApiBearerAuth, ApiBody, ApiCreatedResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { Auth, GetUser } from '../auth/decorators';
import { User } from '../auth/entities/user.entity';
import { PaginationQueryDto } from '../DTOs/pagination/pagination-query.dto';
import { FacturaResponseDto } from './dto/factura-response.dto';
import { CreateComplementoDto } from './dto/create-complemento-dto';
import { FacturaMinimalResponseDto } from './dto/factura-minimal-response.dto';
import { CreateCancelacionDto } from './dto/create-cancelacion-dto';
import { FacturaPaginationDto } from './dto/factura-pagination.dto';
import { CalcularImpuestosResponseDto } from './dto/calcular-impuestos-response-dto';
import { PagoResponseDto } from './dto/pago-response.dto';
import { FacturaSinLiquidarResponseDto } from './dto/factura-sin-liquidar-response.dto';
import { EnumRole } from '../commom/enums/general.enum';


ApiTags('Facturas')
@UseInterceptors(ClassSerializerInterceptor)
@ApiUnauthorizedResponse({ description: 'No autorizado' })
@Controller('facturas')
export class FacturasController {

  constructor(private readonly facturasService: FacturasService) {}

  @Post()
  @Auth(EnumRole.ADMIN)
  @HttpCode(201)
  @ApiOperation({summary: 'Registrar una factura'})
  @ApiBody({type: CreateFacturaDto, description: 'Datos requeridos para registrar una factura'})  
  @ApiCreatedResponse({
    description: 'Factura creada exitosamente',
    schema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          example: 'fac000123'
        }
      }
    }
  })
  createIngreso(@Body() createFacturaDto: CreateFacturaDto, @GetUser() user){
    
    return this.facturasService.createFactura( createFacturaDto, user );

  }

  @Post('/complemento')
  @Auth(EnumRole.ADMIN)
  @HttpCode(201)
  @ApiOperation({summary: 'Registrar Complemento'})  
  @ApiBody({type: CreateComplementoDto, description: 'Datos requeridos para registrar un complemento'})
  @ApiCreatedResponse({
    description: "Complemento creado exitosamente",
    schema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          example: 'cpa000123'
        }
      }
    }
  })
  createPago(@Body() createComplementoDto: CreateComplementoDto, @GetUser() user ){
    
    return this.facturasService.createComplemento(createComplementoDto, user);

  }
 
  @Post('/calcular-impuestos')
  @Auth(EnumRole.ADMIN)
  @HttpCode(201)
  @ApiOperation({summary: 'Calcular impuestos'})
  @ApiOkResponse({ description: 'Listado de impuestos', type: CalcularImpuestosResponseDto })
  calcularImpuestos( @Body() calcularImpuestosDto: CalcularImpuestosDto, @GetUser() user){

    return this.facturasService.calcularImpuestosParaFront( calcularImpuestosDto, user );

  }

  @Post('/cancelar')  
  @Auth(EnumRole.ADMIN)
  @HttpCode(201)
  @ApiOperation({summary: 'Cancelar CFDI'})
  @ApiBody( {type: CreateCancelacionDto, description: 'Datos requeridos para registrar una cancelacion'})
  @ApiCreatedResponse({
    description: "Factura cancelada exitosamente",
    schema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          example: 'fac000123'
        }
      }
    }
  })
  cancelar( @Body() createCancelacionDto: CreateCancelacionDto, @GetUser() user ){
    
    return this.facturasService.createCancelacionFacturaNew( createCancelacionDto, user );

  }

  @Get()
  @Auth(EnumRole.ADMIN)
  @ApiOperation({summary: 'Obtener Facturas (paginado y filtrado)'})
  @ApiOkResponse({description: 'Listado de Facturas', type: FacturaPaginationDto})
  async getPaginado(
    @Query() query: PaginationQueryDto,
    @GetUser() user: User  
  ): Promise<FacturaPaginationDto> {

    const { page, limit, fSearch } = query;

    const { count, pages, facturas } = await this.facturasService.getPaginado( page, limit, fSearch, user );

    return {
      page: page,
      limit: limit,
      totalItems: count,
      totalPages: pages,
      hasNextPage: page < pages,      
      facturas: facturas,
    }
  }

  @Get('/sinliquidar/:receptorrfc')
  @Auth(EnumRole.ADMIN)
  @ApiOperation({summary: 'Obtener listado de Facturas sin Liquidar'})
  @ApiParam({name: 'receptorrfc', description: 'RFC del Receptor', example: 'FUNK671228PH6'})
  @ApiOkResponse({type: FacturaResponseDto, isArray: true, description: 'Facturas encontradas'})
  @ApiNotFoundResponse({description: 'Facturas no encontradas'})
  async getFacturasSinLiquidar( @Param('receptorrfc') receptorrfc: string,  @GetUser() user: User): Promise<FacturaSinLiquidarResponseDto[]> {  

    const facturas = await this.facturasService.getFacturasSinLiquidar( receptorrfc, user );

    
    return facturas;
  }

  @Get('/minimal/:id')
  @Auth(EnumRole.ADMIN)
  @ApiOperation({summary: 'Obtener una Factura por su ID'})
  @ApiParam({name: 'id', description: 'ID de la Factura', example: 'FAC000123'})
  @ApiOkResponse({type: FacturaMinimalResponseDto, description: 'Factura encontrada'})  
  @ApiNotFoundResponse({description: 'Factura no encontrada'})
  async getOneMinimal( @Param('id') id: string,  @GetUser() user: User): Promise<FacturaMinimalResponseDto> {
  //async getOneMinimal( @Param('id') id: string,  @GetUser() user: User): Promise<any> {

    const factura = await this.facturasService.getOneMinimal(id, user);

    //return factura
    return factura as FacturaMinimalResponseDto;
  }

  @Get(':id')
  @Auth(EnumRole.ADMIN)
  @ApiOperation({summary: 'Obtener una Factura por su ID'})
  @ApiParam({name: 'id', description: 'ID de la Factura', example: 'FAC000123'})
  @ApiOkResponse({type: FacturaResponseDto, description: 'Factura encontrada'})
  @ApiNotFoundResponse({description: 'Factura no encontrada'})
  async getOne( @Param('id') id: string,  @GetUser() user: User): Promise<FacturaResponseDto> {    

    const factura = await this.facturasService.getOne(id, user);
  
    return factura as FacturaResponseDto;
  }

  @Get('/:id/pagos')
  @Auth(EnumRole.ADMIN)
  @ApiOperation({summary: 'Obtener Pagos por ID de Factura'})
  @ApiParam({name: 'id', description: 'ID de la Factura', example:' FAC000123'})
  @ApiOkResponse({ type: PagoResponseDto, isArray: true, description: 'Pagos de la Factura'})
  @ApiNotFoundResponse({description: 'Pagos no encontrados'})  
  async getPagos( @Param('id') idFactura: string, @GetUser() user: User)
  :Promise<PagoResponseDto[]>
  {
    
    const pagos = await this.facturasService.getPagos(idFactura.toLocaleLowerCase().trim() , user);
              
    return pagos;
  }

}
