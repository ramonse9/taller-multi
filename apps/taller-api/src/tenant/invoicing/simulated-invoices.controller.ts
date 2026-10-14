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
import { PermissionGuard, RequiresPermissions } from '../../permissions/permission.guard';
import { RequiresFeature, SubscriptionGuard } from '../../subscriptions/subscription.guard';
import {
  CreateSimulatedInvoiceDto,
  PaginatedSimulatedInvoicesResponseDto,
  SimulatedInvoiceCatalogsResponseDto,
  SimulatedInvoiceQueryDto,
  SimulatedInvoiceResponseDto,
  UpdateSimulatedInvoiceDto,
} from './dto/simulated-invoice.dto';
import { SimulatedInvoicesService } from './simulated-invoices.service';

@ApiTags('invoices')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, SubscriptionGuard, PermissionGuard)
@RequiresFeature('invoicing')
@Controller('invoices')
export class SimulatedInvoicesController {
  constructor(private readonly invoices: SimulatedInvoicesService) {}

  @Get('catalogs')
  @RequiresPermissions('invoices.view')
  @ApiOperation({ summary: 'Consultar catálogos fiscales usados por el simulador' })
  @ApiOkResponse({ type: SimulatedInvoiceCatalogsResponseDto })
  catalogs(@CurrentUser() user: AuthenticatedUser): Promise<SimulatedInvoiceCatalogsResponseDto> {
    return this.invoices.catalogs(user);
  }

  @Get()
  @RequiresPermissions('invoices.view')
  @ApiOperation({
    summary: 'Listar simulaciones sin validez fiscal',
    description: 'No lista CFDI ni documentos timbrados.',
  })
  @ApiOkResponse({ type: PaginatedSimulatedInvoicesResponseDto })
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: SimulatedInvoiceQueryDto,
  ): Promise<PaginatedSimulatedInvoicesResponseDto> {
    return this.invoices.list(user, query);
  }

  @Get(':id')
  @RequiresPermissions('invoices.view')
  @ApiOperation({ summary: 'Consultar la representación de una simulación sin validez fiscal' })
  @ApiOkResponse({ type: SimulatedInvoiceResponseDto })
  getOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<SimulatedInvoiceResponseDto> {
    return this.invoices.getOne(user, id);
  }

  @Post()
  @RequiresPermissions('invoices.create')
  @ApiOperation({
    summary: 'Crear un borrador de simulación desde una orden terminada',
    description: 'No genera UUID fiscal, XML, sello SAT ni timbrado.',
  })
  @ApiCreatedResponse({ type: SimulatedInvoiceResponseDto })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: CreateSimulatedInvoiceDto,
  ): Promise<SimulatedInvoiceResponseDto> {
    return this.invoices.create(user, input);
  }

  @Patch(':id')
  @RequiresPermissions('invoices.edit')
  @ApiOperation({ summary: 'Editar un borrador de simulación' })
  @ApiOkResponse({ type: SimulatedInvoiceResponseDto })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() input: UpdateSimulatedInvoiceDto,
  ): Promise<SimulatedInvoiceResponseDto> {
    return this.invoices.update(user, id, input);
  }

  @Post(':id/issue-simulation')
  @HttpCode(HttpStatus.OK)
  @RequiresPermissions('invoices.simulate_issue')
  @ApiOperation({
    summary: 'Emitir una simulación sin validez fiscal',
    description: 'Asigna únicamente serie y folio interno; no genera UUID fiscal ni timbra.',
  })
  @ApiOkResponse({ type: SimulatedInvoiceResponseDto })
  issue(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<SimulatedInvoiceResponseDto> {
    return this.invoices.issue(user, id);
  }

  @Post(':id/cancel-simulation')
  @HttpCode(HttpStatus.OK)
  @RequiresPermissions('invoices.cancel_simulation')
  @ApiOperation({
    summary: 'Cancelar una simulación',
    description: 'No realiza cancelación ante el SAT.',
  })
  @ApiOkResponse({ type: SimulatedInvoiceResponseDto })
  cancel(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<SimulatedInvoiceResponseDto> {
    return this.invoices.cancel(user, id);
  }
}
