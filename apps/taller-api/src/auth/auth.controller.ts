import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import {
  ApiAcceptedResponse,
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/types/authenticated-user';
import { AuthService } from './auth.service';
import { LoginDto, LoginResponseDto, LoginUserResponseDto } from './dto/login.dto';
import {
  CompletePasswordRecoveryDto,
  PasswordRecoveryRequestedDto,
  PasswordRecoveryVerifiedDto,
  RequestPasswordRecoveryDto,
  VerifyPasswordRecoveryDto,
} from './dto/password-recovery.dto';
import { PasswordRecoveryService } from './password-recovery.service';
import { AllowPendingPasswordChange, JwtAuthGuard } from './roles';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly passwordRecovery: PasswordRecoveryService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: LoginResponseDto })
  login(@Body() input: LoginDto): Promise<LoginResponseDto> {
    return this.auth.login(input);
  }

  @Post('password-recovery/request')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiAcceptedResponse({ type: PasswordRecoveryRequestedDto })
  requestPasswordRecovery(
    @Body() input: RequestPasswordRecoveryDto,
  ): Promise<PasswordRecoveryRequestedDto> {
    return this.passwordRecovery.request(input);
  }

  @Post('password-recovery/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: PasswordRecoveryVerifiedDto })
  verifyPasswordRecovery(
    @Body() input: VerifyPasswordRecoveryDto,
  ): Promise<PasswordRecoveryVerifiedDto> {
    return this.passwordRecovery.verify(input);
  }

  @Post('password-recovery/complete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  async completePasswordRecovery(@Body() input: CompletePasswordRecoveryDto): Promise<void> {
    await this.passwordRecovery.complete(input);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @AllowPendingPasswordChange()
  @ApiBearerAuth()
  @ApiOkResponse({ type: LoginUserResponseDto })
  me(@CurrentUser() user: AuthenticatedUser): LoginUserResponseDto {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      loginName: user.loginName,
      phone: user.phone,
      phoneVerifiedAt: user.phoneVerifiedAt,
      fullName: user.fullName,
      role: user.role,
      companyId: user.companyId,
      mustChangePassword: user.mustChangePassword,
      subscription: user.subscription,
    };
  }
}
