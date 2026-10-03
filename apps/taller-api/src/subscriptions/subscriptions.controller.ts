import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard, Roles, RolesGuard } from '../auth/roles';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/types/authenticated-user';
import { PlatformRole } from '../platform-users/entities/platform-user.entity';
import {
  ChangeSubscriptionDto,
  CompanySubscriptionResponseDto,
  SubscriptionPlanResponseDto,
  SubscriptionResponseDto,
} from './dto/subscription.dto';
import { SubscriptionsService } from './subscriptions.service';

@ApiTags('subscriptions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptions: SubscriptionsService) {}

  @Get('plans')
  @ApiOperation({ summary: 'Consultar los planes y capacidades disponibles' })
  @ApiOkResponse({ type: SubscriptionPlanResponseDto, isArray: true })
  plans(): Promise<SubscriptionPlanResponseDto[]> {
    return this.subscriptions.listPlans();
  }

  @Get('current')
  @Roles(PlatformRole.CompanyAdmin, PlatformRole.Admin, PlatformRole.User)
  @ApiOperation({ summary: 'Consultar la suscripción de la compañía autenticada' })
  @ApiOkResponse({ type: SubscriptionResponseDto })
  current(@CurrentUser() user: AuthenticatedUser) {
    return this.subscriptions.current(user);
  }

  @Get('companies')
  @Roles(PlatformRole.PlatformAdmin)
  @ApiOperation({ summary: 'Listar suscripciones de compañías' })
  @ApiOkResponse({ type: CompanySubscriptionResponseDto, isArray: true })
  companies(): Promise<CompanySubscriptionResponseDto[]> {
    return this.subscriptions.listCompanies();
  }

  @Patch('companies/:companyId')
  @Roles(PlatformRole.PlatformAdmin)
  @ApiOperation({ summary: 'Cambiar plan, estado o vigencia sin eliminar información tenant' })
  @ApiOkResponse({ type: CompanySubscriptionResponseDto })
  change(
    @CurrentUser() user: AuthenticatedUser,
    @Param('companyId', new ParseUUIDPipe({ version: '4' })) companyId: string,
    @Body() input: ChangeSubscriptionDto,
  ): Promise<CompanySubscriptionResponseDto> {
    return this.subscriptions.change(user, companyId, input);
  }
}
