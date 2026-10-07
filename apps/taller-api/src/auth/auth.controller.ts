import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiBearerAuth,
  ApiCookieAuth,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SensitiveRateLimit } from '../common/decorators/sensitive-rate-limit.decorator';
import { AuthenticatedUser } from '../common/types/authenticated-user';
import { AllowedOriginGuard } from './allowed-origin.guard';
import { AuthService } from './auth.service';
import {
  LoginDto,
  LoginResponseDto,
  LoginUserResponseDto,
  RefreshResponseDto,
} from './dto/login.dto';
import {
  getRefreshCookieConfiguration,
  RefreshCookieConfiguration,
} from './refresh-cookie.config';
import { readCookie } from './refresh-cookie';
import { AllowPendingPasswordChange, JwtAuthGuard } from './roles';
import { tokenDurationMilliseconds } from './token-duration';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly cookie: RefreshCookieConfiguration;
  private readonly refreshMaxAge: number;

  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {
    this.cookie = getRefreshCookieConfiguration(config);
    this.refreshMaxAge = tokenDurationMilliseconds(
      config.getOrThrow<string>('JWT_REFRESH_EXPIRES_IN'),
    );
  }

  @Post('login')
  @UseGuards(AllowedOriginGuard)
  @SensitiveRateLimit()
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'no-store')
  @Header('Pragma', 'no-cache')
  @ApiOperation({ summary: 'Iniciar sesión y establecer la cookie segura de renovación' })
  @ApiOkResponse({ type: LoginResponseDto })
  @ApiForbiddenResponse({ description: 'Origen ausente o no autorizado' })
  async login(
    @Body() input: LoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<LoginResponseDto> {
    const result = await this.auth.login(input, {
      ipAddress: request.ip || null,
      userAgent: request.get('user-agent') ?? null,
    });
    this.setRefreshCookie(response, result.refreshToken);
    return result.response;
  }

  @Post('refresh')
  @UseGuards(AllowedOriginGuard)
  @SensitiveRateLimit()
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'no-store')
  @Header('Pragma', 'no-cache')
  @ApiOperation({ summary: 'Rotar el refresh token y emitir un access token nuevo' })
  @ApiCookieAuth('refreshCookie')
  @ApiOkResponse({ type: RefreshResponseDto })
  @ApiUnauthorizedResponse({ description: 'Sesión expirada, revocada o reutilizada' })
  @ApiForbiddenResponse({ description: 'Origen ausente o no autorizado' })
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<RefreshResponseDto> {
    const refreshToken = this.readRefreshToken(request);
    if (!refreshToken) {
      this.clearRefreshCookie(response);
      throw new UnauthorizedException('Sesión inválida');
    }
    try {
      const result = await this.auth.refresh(refreshToken);
      this.setRefreshCookie(response, result.refreshToken);
      return { accessToken: result.accessToken };
    } catch (error) {
      this.clearRefreshCookie(response);
      throw error;
    }
  }

  @Post('logout')
  @UseGuards(AllowedOriginGuard)
  @SensitiveRateLimit()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revocar la sesión actual y eliminar la cookie de renovación' })
  @ApiCookieAuth('refreshCookie')
  @ApiNoContentResponse()
  @ApiForbiddenResponse({ description: 'Origen ausente o no autorizado' })
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    try {
      await this.auth.logout(this.readRefreshToken(request));
    } finally {
      this.clearRefreshCookie(response);
    }
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
      companyName: user.companyName,
      mustChangePassword: user.mustChangePassword,
      subscription: user.subscription,
      permissions: user.permissions,
    };
  }

  private readRefreshToken(request: Request): string | null {
    return readCookie(request.headers.cookie, this.cookie.name);
  }

  private setRefreshCookie(response: Response, token: string): void {
    response.cookie(this.cookie.name, token, {
      ...this.cookie.options,
      maxAge: this.refreshMaxAge,
    });
  }

  private clearRefreshCookie(response: Response): void {
    response.clearCookie(this.cookie.name, this.cookie.options);
  }
}
