import { LowercasePipe } from './../pipes/lowercase/lowercase.pipe';
import { UpdateProductoServicioDto } from './dto/update-producto-servicio.dto';
import { ApiBadRequestResponse, ApiBearerAuth, ApiBody, ApiCreatedResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { Controller, Get, Post, Body, Patch, Param, Query, HttpCode, UseInterceptors, ClassSerializerInterceptor } from '@nestjs/common';
import { ProductosServiciosService } from './productos-servicios.service';
import { Auth, GetUser } from '../auth/decorators';
import { PaginationQueryDto } from '../DTOs/pagination/pagination-query.dto';
import { User } from './../auth/entities/user.entity';
import { ProductoServicioResponseDto } from './dto/producto-servicio-response.dto';
import { CreateProductoServicioDto } from './dto/create-producto-servicio.dto';
import { ProductoServicioPaginationDto } from './dto/producto-servicio-pagination.dto';
import { EnumRole } from '../commom/enums/general.enum';

@ApiTags('ProductosServicios')
@UseInterceptors(ClassSerializerInterceptor)
@ApiUnauthorizedResponse({ description: 'No autorizado' })
@Controller('productosservicios')
export class ProductosServiciosController {
  
  constructor(private readonly productosServiciosService: ProductosServiciosService) {}
  
  @Post()
  @Auth(EnumRole.ADMIN)
  @HttpCode(201)
  @ApiOperation({summary: 'Registrar un Producto ó Servicio'})
  @ApiBody({type: CreateProductoServicioDto, description: 'Datos requeridos para registrar un nuevo producto ó servicio'})
  @ApiCreatedResponse({type: ProductoServicioResponseDto, description: 'Producto ó Servicio creado exitosamente'})
  async createProductoServicio(@Body() createProductoServicioDto: CreateProductoServicioDto, @GetUser() user):Promise<ProductoServicioResponseDto>{
    
    const productoServicio = await this.productosServiciosService.createProductoServicio( createProductoServicioDto, user );

    return productoServicio as ProductoServicioResponseDto

  }
  
  @Get()
  @Auth(EnumRole.ADMIN)
  @ApiOperation({summary: 'Obtener Mis Productos y Servicios (paginado y filtrado)'})
  @ApiOkResponse({description: 'Listado de Facturas', type: ProductoServicioPaginationDto})
  async getProductosServicios(
    @Query() query: PaginationQueryDto,
    @GetUser() user: User   
  ): Promise<ProductoServicioPaginationDto> {
    
    const { page, limit, fSearch } = query;

    const { count, pages, productosServicios } = await this.productosServiciosService.getPaginadoProductosServicios( page, limit, fSearch, user );

    return {
      page: page,
      limit: limit,
      totalItems: count,
      totalPages: pages,
      hasNextPage: page < pages,      
      productosServicios: productosServicios as ProductoServicioResponseDto[],
    }
  }
  
  @Get(':id')
  @Auth(EnumRole.ADMIN)
  @HttpCode(201)
  @ApiOperation({summary: 'Obtener un Producto ó Servicio'})
  @ApiOkResponse({ type: ProductoServicioResponseDto, description: 'Producto ó Servicio encontrado'})
  @ApiNotFoundResponse({description: 'Producto ó Servicio no encontrado'})
  async findOne(
    @Param('id') id: string,
    @GetUser() user: User
  ):Promise<ProductoServicioResponseDto> {
    
    //return this.productosServiciosService.getProductoServicioById(id, user);
    const productoServicio = await this.productosServiciosService.getProductoServicioById(id, user);
    return productoServicio as ProductoServicioResponseDto
  }
  
  @Patch(':id')  
  @Auth(EnumRole.ADMIN)
  @ApiOperation({summary: 'Actualizar información del Producto ó Servicio'})
  @ApiParam({name: 'id', description: 'ID del Producto ó Servicio', example: 'PRO000123'})
  @ApiBody({type: UpdateProductoServicioDto, description: 'Datos requeridos para actualizar un Producto ó Servicio'})
  @ApiOkResponse({type: ProductoServicioResponseDto, description: 'Producto ó Servicio actualizado exitosamente'})
  @ApiBadRequestResponse({description: 'Datos inválidos'})
  @ApiNotFoundResponse({description: 'Orden no encontrada'})
  async update(
        @Param('id', new LowercasePipe()) id: string, 
        //@Body(new ForbidFieldsPipe(['id_sat_producto_servicio'])) updateProductoServicioDto: UpdateProductoServicioDto,
        @Body() updateProductoServicioDto: UpdateProductoServicioDto,
        @GetUser() user: User
      ) {

    //return this.productosServiciosService.update(id, updateProductoServicioDto, user);
    const productoServicio = await this.productosServiciosService.update(id, updateProductoServicioDto, user);
    return productoServicio as ProductoServicioResponseDto

  }  
  
}