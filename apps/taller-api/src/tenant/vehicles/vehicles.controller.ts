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
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/roles';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { RequiresFeature, SubscriptionGuard } from '../../subscriptions/subscription.guard';
import { PermissionGuard, RequiresPermissions } from '../../permissions/permission.guard';
import { PermissionsService } from '../../permissions/permissions.service';
import {
  CreateVehicleDto,
  UpdateVehicleDto,
  VehicleHistoryQueryDto,
  VehicleHistoryResponseDto,
  VehicleResponseDto,
} from './dto/vehicle.dto';
import { VehiclesService } from './vehicles.service';

@ApiTags('vehicles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, SubscriptionGuard, PermissionGuard)
@RequiresFeature('vehicle_history')
@Controller('clients/:clientId/vehicles')
export class VehiclesController {
  constructor(
    private readonly vehicles: VehiclesService,
    private readonly permissions: PermissionsService,
  ) {}

  @Get()
  @RequiresPermissions('vehicles.view')
  @ApiOkResponse({ type: VehicleResponseDto, isArray: true })
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Param('clientId', new ParseUUIDPipe({ version: '4' })) clientId: string,
  ): Promise<VehicleResponseDto[]> {
    return this.vehicles.list(user, clientId);
  }

  @Get(':id')
  @RequiresPermissions('vehicles.view')
  @ApiOkResponse({ type: VehicleResponseDto })
  getOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('clientId', new ParseUUIDPipe({ version: '4' })) clientId: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<VehicleResponseDto> {
    return this.vehicles.getOne(user, clientId, id);
  }

  @Post()
  @RequiresPermissions('vehicles.create')
  @ApiCreatedResponse({ type: VehicleResponseDto })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('clientId', new ParseUUIDPipe({ version: '4' })) clientId: string,
    @Body() input: CreateVehicleDto,
  ): Promise<VehicleResponseDto> {
    return this.vehicles.create(user, clientId, input);
  }

  @Patch(':id')
  @ApiOkResponse({ type: VehicleResponseDto })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('clientId', new ParseUUIDPipe({ version: '4' })) clientId: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() input: UpdateVehicleDto,
  ): Promise<VehicleResponseDto> {
    const editsData = Object.entries(input).some(
      ([field, value]) => field !== 'isActive' && value !== undefined,
    );
    if (editsData) this.permissions.assert(user, 'vehicles.edit');
    if (input.isActive !== undefined) this.permissions.assert(user, 'vehicles.deactivate');
    return this.vehicles.update(user, clientId, id, input);
  }
}

@ApiTags('vehicles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, SubscriptionGuard, PermissionGuard)
@RequiresFeature('vehicle_history')
@Controller('vehicles')
export class VehicleHistoryController {
  constructor(private readonly vehicles: VehiclesService) {}

  @Get('history')
  @RequiresPermissions('vehicles.view')
  @ApiOkResponse({ type: VehicleHistoryResponseDto })
  history(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: VehicleHistoryQueryDto,
  ): Promise<VehicleHistoryResponseDto> {
    return this.vehicles.history(user, query);
  }
}
