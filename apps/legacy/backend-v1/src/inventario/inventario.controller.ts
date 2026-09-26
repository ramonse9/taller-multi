import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  UseInterceptors,
  ClassSerializerInterceptor,
  Param,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Auth } from '../auth/decorators/auth.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../auth/entities/user.entity';
import { EnumRole } from '../commom/enums/general.enum';
import { CreateAjusteInventarioDto } from './dto/create-ajuste-inventario.dto';
import { InventarioConsultaService } from './inventario-consulta.service';
import { PaginationQueryDto } from '../DTOs/pagination/pagination-query.dto';
import { LowercasePipe } from '../pipes/lowercase/lowercase.pipe';

@ApiTags('Inventario')
@UseInterceptors(ClassSerializerInterceptor)
@ApiUnauthorizedResponse({ description: 'No autorizado' })
@Controller('inventario')
export class InventarioController {
  constructor(
    private readonly inventarioConsultaService: InventarioConsultaService,
  ) {}

  @Get('lotes/:idProducto')
  @Auth(EnumRole.ADMIN)
  @ApiOperation({ summary: 'Lotes por producto (FIFO)' })
  getLotes(
    //@Query('productoId') productoId: string,
    @Param('idProducto', new LowercasePipe()) idProducto: string,
    @GetUser() user: User,
  ) {
    return this.inventarioConsultaService.getLotesPorProducto(
      idProducto,
      user,
    );
  }

  @Get('lotes')
  @Auth(EnumRole.ADMIN)
  @ApiOperation({summary: 'Obtener Lotes de Inventario (paginado y filtrado)'})
  //@ApiOkResponse({description: 'Listado de Compras', type: OrdenPaginationDto})
  async getPaginadoLotes(
        @Query() query: PaginationQueryDto,
        @GetUser() user: User
  ) {
  //): Promise<CompraPaginationDto> {

    const { page, limit, fSearch } = query;    
    const { count, pages, inventarioLotes } = await this.inventarioConsultaService.getPaginadoLotes( page, limit, fSearch, user )

    return {
      page: page,
      limit: limit,
      totalItems: count,
      totalPages: pages,
      hasNextPage: page < pages,
      inventarioLotes: inventarioLotes
      //compras: compras.map( mapCompra )
    }
    
  }

  /*
  @Get('movimientos')
  @Auth(EnumRole.ADMIN)
  @ApiOperation({ summary: 'Historial de movimientos de inventario' })
  getMovimientos(
    @Query('productoId') productoId: string | undefined,
    @GetUser() user: User,
  ) {
    return this.inventarioConsultaService.getMovimientos(productoId, user);
  }*/

  @Get('movimientos')
  @Auth(EnumRole.ADMIN)
  @ApiOperation({summary: 'Obtener Movimientos de Inventario (paginado y filtrado)'})
  //@ApiOkResponse({description: 'Listado de Compras', type: OrdenPaginationDto})
  async getPaginado(
        @Query() query: PaginationQueryDto,
        @GetUser() user: User
  ) {
  //): Promise<CompraPaginationDto> {

    const { page, limit, fSearch } = query;    
    const { count, pages, inventarioMovimientos } = await this.inventarioConsultaService.getPaginadoMovimientos( page, limit, fSearch, user )

    return {
      page: page,
      limit: limit,
      totalItems: count,
      totalPages: pages,
      hasNextPage: page < pages,
      inventarioMovimientos: inventarioMovimientos
      //compras: compras.map( mapCompra )
    }
    
  }

  @Post('ajustes')
  @Auth(EnumRole.ADMIN)
  @HttpCode(201)
  @ApiOperation({ summary: 'Ajuste manual de inventario' })
  crearAjuste(
    @Body() dto: CreateAjusteInventarioDto,
    @GetUser() user: User,
  ) {
    return this.inventarioConsultaService.crearAjuste(dto, user);
  }
}
