import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { ApiOperation, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { Auth } from '../auth/decorators/auth.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../auth/entities/user.entity';
import { EnumRole } from '../commom/enums/general.enum';
import { PaginationQueryDto } from '../DTOs/pagination/pagination-query.dto';
import { LowercasePipe } from '../pipes/lowercase/lowercase.pipe';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';
import { ProductosService } from './productos.service';

@ApiTags('Productos')
@UseInterceptors(ClassSerializerInterceptor)
@ApiUnauthorizedResponse({ description: 'No autorizado' })
@Controller('productos')
export class ProductosController {
  constructor(private readonly productosService: ProductosService) {}

  @Post()
  @Auth(EnumRole.ADMIN)
  @HttpCode(201)
  @ApiOperation({ summary: 'Crear producto' })
  create(@Body() dto: CreateProductoDto, @GetUser() user: User) {
    return this.productosService.create(dto, user);
  }

  @Post('migrar-desde-legacy/:id')
  @Auth(EnumRole.ADMIN)
  @HttpCode(201)
  @ApiOperation({ summary: 'Migrar desde pri_productos_servicios' })
  migrar(
    @Param('id', new LowercasePipe()) id: string,
    @GetUser() user: User,
  ) {
    return this.productosService.migrarDesdeLegacy(id, user);
  }

  @Get()
  @Auth(EnumRole.ADMIN)
  @ApiOperation({ summary: 'Listar productos' })
  async findAll(@Query() query: PaginationQueryDto, @GetUser() user: User) {
    const { page, limit, fSearch } = query;
    const { items, count, pages } = await this.productosService.findAll(
      page,
      limit,
      fSearch ?? '',
      user,
    );
    return {
      page,
      limit,
      totalItems: count,
      totalPages: pages,
      hasNextPage: page < pages,
      productos: items,
    };
  }

  @Get(':id')
  @Auth(EnumRole.ADMIN)
  findOne(@Param('id', new LowercasePipe()) id: string, @GetUser() user: User) {
    return this.productosService.findOne(id, user);
  }

  @Patch(':id')
  @Auth(EnumRole.ADMIN)
  update(
    @Param('id', new LowercasePipe()) id: string,
    @Body() dto: UpdateProductoDto,
    @GetUser() user: User,
  ) {
    return this.productosService.update(id, dto, user);
  }
}
