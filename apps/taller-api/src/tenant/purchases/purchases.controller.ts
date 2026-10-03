import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/roles';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { RequiresFeature, SubscriptionGuard } from '../../subscriptions/subscription.guard';
import { PermissionGuard, RequiresPermissions } from '../../permissions/permission.guard';
import { PermissionsService } from '../../permissions/permissions.service';
import {
  ChangePurchaseStatusDto,
  CreatePurchaseDto,
  PaginatedPurchasesResponseDto,
  PurchaseIndicatorsResponseDto,
  PurchaseQueryDto,
  PurchaseResponseDto,
  UpdatePurchaseDto,
  PurchaseStatus,
} from './dto/purchase.dto';
import { PurchasesService } from './purchases.service';

@ApiTags('purchases')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, SubscriptionGuard, PermissionGuard)
@RequiresFeature('inventory')
@Controller('purchases')
export class PurchasesController {
  constructor(
    private readonly purchases: PurchasesService,
    private readonly permissions: PermissionsService,
  ) {}

  @Get('indicators')
  @RequiresPermissions('purchases.view', 'catalog.view_costs')
  @ApiOperation({ summary: 'Consultar resumen reciente y variaciones de costos' })
  @ApiOkResponse({ type: PurchaseIndicatorsResponseDto })
  indicators(@CurrentUser() user: AuthenticatedUser): Promise<PurchaseIndicatorsResponseDto> {
    return this.purchases.indicators(user);
  }

  @Get()
  @RequiresPermissions('purchases.view', 'catalog.view_costs')
  @ApiOperation({ summary: 'Listar y buscar compras de la compañía' })
  @ApiOkResponse({ type: PaginatedPurchasesResponseDto })
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: PurchaseQueryDto,
  ): Promise<PaginatedPurchasesResponseDto> {
    return this.purchases.list(user, query);
  }

  @Get(':id')
  @RequiresPermissions('purchases.view', 'catalog.view_costs')
  @ApiOperation({ summary: 'Consultar una compra y sus productos' })
  @ApiOkResponse({ type: PurchaseResponseDto })
  getOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<PurchaseResponseDto> {
    return this.purchases.getOne(user, id);
  }

  @Post()
  @RequiresPermissions('purchases.create', 'catalog.view_costs')
  @ApiOperation({ summary: 'Crear una compra en borrador con folio automático' })
  @ApiCreatedResponse({ type: PurchaseResponseDto })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: CreatePurchaseDto,
  ): Promise<PurchaseResponseDto> {
    return this.purchases.create(user, input);
  }

  @Patch(':id')
  @RequiresPermissions('purchases.edit', 'catalog.view_costs')
  @ApiOperation({ summary: 'Editar una compra mientras permanece en borrador' })
  @ApiOkResponse({ type: PurchaseResponseDto })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() input: UpdatePurchaseDto,
  ): Promise<PurchaseResponseDto> {
    return this.purchases.update(user, id, input);
  }

  @Post(':id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirmar o cancelar una compra' })
  @ApiOkResponse({ type: PurchaseResponseDto })
  changeStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() input: ChangePurchaseStatusDto,
  ): Promise<PurchaseResponseDto> {
    this.permissions.assert(
      user,
      input.status === PurchaseStatus.Confirmed ? 'purchases.confirm' : 'purchases.cancel',
    );
    return this.purchases.changeStatus(user, id, input);
  }
}
