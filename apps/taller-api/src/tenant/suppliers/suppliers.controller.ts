import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/roles';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { RequiresFeature, SubscriptionGuard } from '../../subscriptions/subscription.guard';
import {
  CreateSupplierDto,
  PaginatedSuppliersResponseDto,
  SupplierQueryDto,
  SupplierResponseDto,
  UpdateSupplierDto,
} from './dto/supplier.dto';
import { SuppliersService } from './suppliers.service';

@ApiTags('suppliers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, SubscriptionGuard)
@RequiresFeature('item_catalog')
@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliers: SuppliersService) {}

  @Get()
  @ApiOperation({ summary: 'Listar proveedores de la compañía' })
  @ApiOkResponse({ type: PaginatedSuppliersResponseDto })
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: SupplierQueryDto,
  ): Promise<PaginatedSuppliersResponseDto> {
    return this.suppliers.list(user, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar un proveedor' })
  @ApiOkResponse({ type: SupplierResponseDto })
  getOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<SupplierResponseDto> {
    return this.suppliers.getOne(user, id);
  }

  @Post()
  @ApiOperation({ summary: 'Registrar un proveedor' })
  @ApiCreatedResponse({ type: SupplierResponseDto })
  @ApiConflictResponse({ description: 'Nombre comercial o RFC duplicado' })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: CreateSupplierDto,
  ): Promise<SupplierResponseDto> {
    return this.suppliers.create(user, input);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Editar, activar o desactivar un proveedor' })
  @ApiOkResponse({ type: SupplierResponseDto })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() input: UpdateSupplierDto,
  ): Promise<SupplierResponseDto> {
    return this.suppliers.update(user, id, input);
  }
}
