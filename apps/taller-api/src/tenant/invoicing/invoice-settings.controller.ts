import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard, Roles, RolesGuard } from '../../auth/roles';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { PermissionGuard, RequiresPermissions } from '../../permissions/permission.guard';
import { PlatformRole } from '../../platform-users/entities/platform-user.entity';
import { RequiresFeature, SubscriptionGuard } from '../../subscriptions/subscription.guard';
import {
  ChangeInvoiceModeDto,
  InvoiceSettingsResponseDto,
  PlatformInvoiceModeResponseDto,
  UpdateInvoiceSettingsDto,
} from './dto/invoice-settings.dto';
import { InvoiceSettingsService } from './invoice-settings.service';

@ApiTags('invoices')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, SubscriptionGuard, PermissionGuard)
@RequiresFeature('invoicing')
@Controller('invoices/settings')
export class InvoiceSettingsController {
  constructor(private readonly settings: InvoiceSettingsService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles(PlatformRole.CompanyAdmin)
  @RequiresPermissions('invoices.view')
  @ApiOperation({
    summary: 'Consultar la configuración del emisor para facturación simulada',
    description: 'No genera CFDI ni tiene validez fiscal.',
  })
  @ApiOkResponse({ type: InvoiceSettingsResponseDto })
  get(@CurrentUser() user: AuthenticatedUser): Promise<InvoiceSettingsResponseDto> {
    return this.settings.getForTenant(user);
  }

  @Patch()
  @UseGuards(RolesGuard)
  @Roles(PlatformRole.CompanyAdmin)
  @RequiresPermissions('invoices.configure')
  @ApiOperation({
    summary: 'Actualizar el perfil fiscal del emisor',
    description: 'Exclusivo del Administrador principal. No almacena CSD ni credenciales PAC.',
  })
  @ApiOkResponse({ type: InvoiceSettingsResponseDto })
  @ApiBadRequestResponse({ description: 'Perfil fiscal inválido o incompatible' })
  @ApiForbiddenResponse({ description: 'Plan o rol insuficiente' })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: UpdateInvoiceSettingsDto,
  ): Promise<InvoiceSettingsResponseDto> {
    return this.settings.updateForTenant(user, input);
  }
}

@ApiTags('companies', 'invoices')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(PlatformRole.PlatformAdmin)
@Controller('companies/:companyId/invoicing-mode')
export class PlatformInvoiceModeController {
  constructor(private readonly settings: InvoiceSettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Consultar el modo de facturación de una compañía' })
  @ApiOkResponse({ type: PlatformInvoiceModeResponseDto })
  get(
    @Param('companyId', new ParseUUIDPipe({ version: '4' })) companyId: string,
  ): Promise<PlatformInvoiceModeResponseDto> {
    return this.settings.getPlatformMode(companyId);
  }

  @Patch()
  @ApiOperation({
    summary: 'Habilitar o deshabilitar la simulación para una compañía',
    description:
      'No modifica el RFC, régimen, razón social ni código postal fiscal del emisor.',
  })
  @ApiOkResponse({ type: PlatformInvoiceModeResponseDto })
  @ApiForbiddenResponse({ description: 'Se requiere plan Facturación activo' })
  update(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('companyId', new ParseUUIDPipe({ version: '4' })) companyId: string,
    @Body() input: ChangeInvoiceModeDto,
  ): Promise<PlatformInvoiceModeResponseDto> {
    return this.settings.changePlatformMode(actor, companyId, input);
  }
}
