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
import { CreateProveedorDto } from './dto/create-proveedor.dto';
import { UpdateProveedorDto } from './dto/update-proveedor.dto';
import { ProveedoresService } from './proveedores.service';

@ApiTags('Proveedores')
@UseInterceptors(ClassSerializerInterceptor)
@ApiUnauthorizedResponse({ description: 'No autorizado' })
@Controller('proveedores')
export class ProveedoresController {
  constructor(private readonly proveedoresService: ProveedoresService) {}

  @Post()
  @Auth(EnumRole.ADMIN)
  @HttpCode(201)
  create(@Body() dto: CreateProveedorDto, @GetUser() user: User) {
    return this.proveedoresService.create(dto, user);
  }

  @Get()
  @Auth(EnumRole.ADMIN)
  async findAll(@Query() query: PaginationQueryDto, @GetUser() user: User) {
    const { page, limit, fSearch } = query;
    const { items, count, pages } = await this.proveedoresService.findAll(
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
      proveedores: items,
    };
  }

  @Get(':id')
  @Auth(EnumRole.ADMIN)
  findOne(@Param('id', new LowercasePipe()) id: string, @GetUser() user: User) {
    return this.proveedoresService.findOne(id, user);
  }

  @Patch(':id')
  @Auth(EnumRole.ADMIN)
  update(
    @Param('id', new LowercasePipe()) id: string,
    @Body() dto: UpdateProveedorDto,
    @GetUser() user: User,
  ) {
    return this.proveedoresService.update(id, dto, user);
  }
}
