import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SensitiveRateLimit } from '../common/decorators/sensitive-rate-limit.decorator';
import { AuthenticatedUser } from '../common/types/authenticated-user';
import { AuthService } from './auth.service';
import { LoginDto, LoginResponseDto, LoginUserResponseDto } from './dto/login.dto';
import { AllowPendingPasswordChange, JwtAuthGuard } from './roles';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  @SensitiveRateLimit()
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: LoginResponseDto })
  login(@Body() input: LoginDto): Promise<LoginResponseDto> {
    return this.auth.login(input);
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
      permissions: user.permissions,
    };
  }
}
