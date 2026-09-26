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
import { CreateServicioDto } from './dto/create-servicio.dto';
import { UpdateServicioDto } from './dto/update-servicio.dto';
import { ServiciosService } from './servicios.service';

@ApiTags('Servicios')
@UseInterceptors(ClassSerializerInterceptor)
@ApiUnauthorizedResponse({ description: 'No autorizado' })
@Controller('servicios')
export class ServiciosController {
  constructor(private readonly serviciosService: ServiciosService) {}

  @Post()
  @Auth(EnumRole.ADMIN)
  @HttpCode(201)
  create(@Body() dto: CreateServicioDto, @GetUser() user: User) {
    return this.serviciosService.create(dto, user);
  }

  @Get()
  @Auth(EnumRole.ADMIN)
  async findAll(@Query() query: PaginationQueryDto, @GetUser() user: User) {
    const { page, limit, fSearch } = query;
    const { items, count, pages } = await this.serviciosService.findAll(
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
      servicios: items,
    };
  }

  @Get(':id')
  @Auth(EnumRole.ADMIN)
  findOne(@Param('id', new LowercasePipe()) id: string, @GetUser() user: User) {
    return this.serviciosService.findOne(id, user);
  }

  @Patch(':id')
  @Auth(EnumRole.ADMIN)
  update(
    @Param('id', new LowercasePipe()) id: string,
    @Body() dto: UpdateServicioDto,
    @GetUser() user: User,
  ) {
    return this.serviciosService.update(id, dto, user);
  }
}
