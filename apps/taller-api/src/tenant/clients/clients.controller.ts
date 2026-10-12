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
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/roles';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { RequiresFeature, SubscriptionGuard } from '../../subscriptions/subscription.guard';
import { PermissionGuard, RequiresPermissions } from '../../permissions/permission.guard';
import { PermissionsService } from '../../permissions/permissions.service';
import { ClientsService } from './clients.service';
import {
  CfdiUseQueryDto,
  CfdiUseResponseDto,
  ClientQueryDto,
  ClientResponseDto,
  ClientsTotalResponseDto,
  CreateClientDto,
  FiscalRegimeQueryDto,
  FiscalRegimeResponseDto,
  PaginatedClientsResponseDto,
  UpdateClientDto,
} from './dto/client.dto';

@ApiTags('clients')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, SubscriptionGuard, PermissionGuard)
@RequiresFeature('customer_history')
@Controller('clients')
export class ClientsController {
  constructor(
    private readonly clients: ClientsService,
    private readonly permissions: PermissionsService,
  ) {}

  @Get()
  @RequiresPermissions('clients.view')
  @ApiOkResponse({ type: PaginatedClientsResponseDto })
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ClientQueryDto,
  ): Promise<PaginatedClientsResponseDto> {
    return this.clients.list(user, query);
  }

  @Get('total')
  @RequiresPermissions('clients.view')
  @ApiOkResponse({ type: ClientsTotalResponseDto })
  total(@CurrentUser() user: AuthenticatedUser): Promise<ClientsTotalResponseDto> {
    return this.clients.total(user);
  }

  @Get('fiscal-regimes')
  @RequiresPermissions('clients.view')
  @ApiOkResponse({ type: FiscalRegimeResponseDto, isArray: true })
  fiscalRegimes(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: FiscalRegimeQueryDto,
  ): Promise<FiscalRegimeResponseDto[]> {
    return this.clients.listFiscalRegimes(user, query.customerType);
  }

  @Get('cfdi-uses')
  @RequiresPermissions('clients.view')
  @ApiOkResponse({ type: CfdiUseResponseDto, isArray: true })
  @ApiBadRequestResponse({ description: 'El régimen fiscal no existe o no es compatible' })
  cfdiUses(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: CfdiUseQueryDto,
  ): Promise<CfdiUseResponseDto[]> {
    return this.clients.listCfdiUses(user, query);
  }

  @Get(':id')
  @RequiresPermissions('clients.view')
  @ApiOkResponse({ type: ClientResponseDto })
  getOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<ClientResponseDto> {
    return this.clients.getOne(user, id);
  }

  @Post()
  @RequiresPermissions('clients.create')
  @ApiCreatedResponse({ type: ClientResponseDto })
  @ApiBadRequestResponse({
    description: 'El régimen fiscal o el Uso CFDI no existe, no está vigente o es incompatible',
  })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: CreateClientDto,
  ): Promise<ClientResponseDto> {
    return this.clients.create(user, input);
  }

  @Patch(':id')
  @ApiOkResponse({ type: ClientResponseDto })
  @ApiBadRequestResponse({
    description: 'El régimen fiscal o el Uso CFDI no existe, no está vigente o es incompatible',
  })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() input: UpdateClientDto,
  ): Promise<ClientResponseDto> {
    const editsData = Object.entries(input).some(
      ([field, value]) => field !== 'isActive' && value !== undefined,
    );
    if (editsData) this.permissions.assert(user, 'clients.edit');
    if (input.isActive !== undefined) this.permissions.assert(user, 'clients.deactivate');
    return this.clients.update(user, id, input);
  }
}
