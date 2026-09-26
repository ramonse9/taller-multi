import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  UseInterceptors,
  ClassSerializerInterceptor,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { Auth } from '../auth/decorators/auth.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../auth/entities/user.entity';
import { EnumRole } from '../commom/enums/general.enum';
import { LowercasePipe } from '../pipes/lowercase/lowercase.pipe';
import { ComprasService } from './compras.service';
import { CreateCompraDto } from './dto/create-compra.dto';
import { PaginationQueryDto } from '../DTOs/pagination/pagination-query.dto';
import { CompraPaginationDto } from './dto/compra-pagination.dto';
import { mapCompra } from './mappers/compra.mapper';
//import { mapCompraToResponseDto } from './mappers/compra.mapper';

@ApiTags('Compras')
@UseInterceptors(ClassSerializerInterceptor)
@ApiUnauthorizedResponse({ description: 'No autorizado' })
@Controller('compras')
export class ComprasController {
  constructor(private readonly comprasService: ComprasService) {}

  @Post()
  @Auth(EnumRole.ADMIN)
  @HttpCode(201)
  @ApiOperation({ summary: 'Crear compra en borrador' })
  create(@Body() dto: CreateCompraDto, @GetUser() user: User) {
    return this.comprasService.create(dto, user);
  }

  @Post(':id/confirmar')
  @Auth(EnumRole.ADMIN)
  @HttpCode(200)
  @ApiOperation({ summary: 'Confirmar compra y generar lotes FIFO' })
  confirmar(@Param('id', new LowercasePipe()) id: string, @GetUser() user: User) {
    return this.comprasService.confirmar(id, user);
  }

  @Post(':id/cancelar')
  @Auth(EnumRole.ADMIN)
  @HttpCode(200)
  @ApiOperation({ summary: 'Cancelar compra en borrador' })
  cancelar(@Param('id', new LowercasePipe()) id: string, @GetUser() user: User) {
    return this.comprasService.cancelar(id, user);
  }

  @Get()
  @Auth(EnumRole.ADMIN)
  @ApiOperation({summary: 'Obtener Compras (paginado y filtrado)'})
  //@ApiOkResponse({description: 'Listado de Compras', type: OrdenPaginationDto})
  async getPaginado(
        @Query() query: PaginationQueryDto,
        @Query('estatus') estatus: string,
        //@Res({ passthrough: true }) res: Response,
        @GetUser() user: User
  ) {
  //): Promise<CompraPaginationDto> {

    const { page, limit, fSearch } = query;
    const listaEstatus = estatus ? estatus.split(',') : []; 
    const { count, pages, compras } = await this.comprasService.getPaginado( page, limit, fSearch, listaEstatus, user )

    return {
      page: page,
      limit: limit,
      totalItems: count,
      totalPages: pages,
      hasNextPage: page < pages,
      compras: compras
      //compras: compras.map( mapCompra )
    }
    
  }

  @Get(':id')
  @Auth(EnumRole.ADMIN)
  findOne(@Param('id', new LowercasePipe()) id: string, @GetUser() user: User) {
    return this.comprasService.findOne(id, user);
  }
}
