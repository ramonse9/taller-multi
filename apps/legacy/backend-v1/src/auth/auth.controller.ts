import { Controller, Get, Post, Body, UseGuards, Req, Headers, HttpCode, HttpStatus, UseInterceptors, ClassSerializerInterceptor, Res, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginUserDto } from './dto';
import { ApiBadRequestResponse, ApiBearerAuth, ApiBody, ApiCreatedResponse, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { User } from './entities/user.entity';
import { Auth, GetUser } from './decorators';
import { AuthGuard } from '@nestjs/passport';
import { EnumRole } from './../commom/enums/general.enum';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginCheckStatusResponseDto, LoginRefreshResponseDto, LoginResponseDto } from './dto/login-response.dto';
import { ChangePasswordResponseDto } from './dto/change-password-response.dto';
import { Throttle } from '@nestjs/throttler';
import { Response, Request, CookieOptions } from 'express';

@ApiTags('Auth')
@UseInterceptors(ClassSerializerInterceptor)
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private getRefreshCookieOptions():CookieOptions {
    return {
      httpOnly: true,
      secure: process.env.STAGE === 'prod',
      sameSite:
        process.env.STAGE === 'prod'
          ? 'none'
          : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
      domain:
        process.env.STAGE === 'prod'
          ? process.env.COOKIE_DOMAIN
          : undefined,
    };
  }
    
  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Iniciar sesion' })
  @ApiBody({ type: LoginUserDto, description: 'Datos requeridos para iniciar sesion'})
  @ApiCreatedResponse({description: 'Inicio de sesion exitoso', type: LoginResponseDto})
  @ApiBadRequestResponse({description: 'Datos inválidos'})
  async loginUser(
    @Body() loginUserDto: LoginUserDto,
    @Headers('x-client-type') clientType: string,
    @Res({ passthrough: true }) res: Response
  ) {

    const isMobile = clientType === 'mobile';

    const data = await this.authService.login(loginUserDto);

    if( isMobile ){

      return {
        user: data.user,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      };
      
    }

    res.cookie('refreshToken', data.refreshToken, this.getRefreshCookieOptions()  ) 
   
    return {
      user: data.user,
      accessToken: data.accessToken,
    };

  }

  @Get('check-status')
  @Auth(EnumRole.CAPTURISTA)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({summary: 'Check Status'})    
  @ApiResponse({ status: 200, description: 'Check Status exitoso', type: LoginCheckStatusResponseDto })
  @ApiBadRequestResponse({description: 'Token inválido o expirado'})
  checkAuthStatus(
    @GetUser() user: User
  ): Promise<LoginCheckStatusResponseDto>{
    return this.authService.checkAuthStatus( user );
  }

  @Post('change-password')
  @Auth(EnumRole.CAPTURISTA)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({summary: 'Cambiar password'})
  @ApiBody({type: ChangePasswordDto, description: 'Datos requeridos para cambiar el password'})
  @ApiResponse({status:200, description: 'Cambio de password exitoso', type: ChangePasswordResponseDto })
  @ApiBadRequestResponse({description: 'Datos inválidos'})
  changePassword(
    @GetUser() user: any,
    @Body() body: ChangePasswordDto
  ): Promise<ChangePasswordResponseDto> {
    return this.authService.changePassword(
      user.id,
      body.currentPassword,
      body.newPassword
    );
  }

  @Post('refresh')
  @ApiResponse({status: 200, description: 'Refresh correcto', type: LoginRefreshResponseDto})
  @Throttle({ default: { limit: 10, ttl: 60000 } })
    async refresh(
    @Req() req: Request,
    @Headers('x-client-type') clientType: string,
    @Res({ passthrough: true }) res: Response
  ) {

    const isMobile =
    clientType === 'mobile';

    let refreshToken: string;

    if (isMobile) {

      const authHeader =
        req.headers.authorization;

      if (
        !authHeader ||
        !authHeader.startsWith('Bearer ')
      ) {

        throw new UnauthorizedException(
          'Refresh token requerido'
        );
      }

      refreshToken = authHeader.replace(
        'Bearer ',
        '',
      );

    } else {

      refreshToken =
        req.cookies?.refreshToken;

      if (!refreshToken) {

        throw new UnauthorizedException(
          'Refresh token requerido'
        );
      }
    }

    const data =
      await this.authService.refresh(
        refreshToken
      );

    if (isMobile) {

      return {
        accessToken:
          data.accessToken,

        refreshToken:
          data.refreshToken,
      };
    }

    res.cookie(
      'refreshToken',
      data.refreshToken,
      this.getRefreshCookieOptions(),
    );

    return {
      accessToken:
        data.accessToken,
    };

  }

  @Post('logout')
  @Auth(EnumRole.CAPTURISTA)
  async logout(
    @GetUser() user: User,
    @Res({ passthrough: true }) res: Response
  ) {

    await this.authService.logout(user.id);

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.STAGE === 'prod',
      sameSite: process.env.STAGE === 'prod' ? 'none' : 'lax',
      path: '/',
      domain:
        process.env.STAGE === 'prod'
          ? process.env.COOKIE_DOMAIN
          : undefined,
    });

    return {
      message: 'Logout exitoso'
    };
  }

}
