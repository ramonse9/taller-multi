import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { DataSource, Repository } from 'typeorm';
import { AuthenticatedUser } from '../common/types/authenticated-user';
import { Company } from '../companies/entities/company.entity';
import { PlatformRole, PlatformUser } from '../platform-users/entities/platform-user.entity';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

interface JwtPayload {
  sub: string;
  jti: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    @InjectRepository(PlatformUser) private readonly users: Repository<PlatformUser>,
    @InjectRepository(Company) private readonly companies: Repository<Company>,
    private readonly dataSource: DataSource,
    private readonly subscriptions: SubscriptionsService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
      issuer: config.getOrThrow<string>('JWT_ISSUER'),
      audience: config.getOrThrow<string>('JWT_AUDIENCE'),
      ignoreExpiration: false,
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    if (!payload.jti) throw new UnauthorizedException('Sesión inválida');
    const sessions = await this.dataSource.query<Array<{ id: string }>>(
      `SELECT id FROM public.auth_sessions
       WHERE id = $1 AND user_id = $2 AND revoked_at IS NULL
         AND last_used_at >= now() - interval '14 days'`,
      [payload.jti, payload.sub],
    );
    if (!sessions[0]) throw new UnauthorizedException('Sesión expirada');
    await this.dataSource.query(
      `UPDATE public.auth_sessions SET last_used_at = now()
       WHERE id = $1 AND last_used_at < now() - interval '5 minutes'`,
      [payload.jti],
    );
    const user = await this.users.findOneBy({ id: payload.sub });
    if (!user?.isActive) throw new UnauthorizedException('Sesión inválida');

    if (user.role === PlatformRole.PlatformAdmin) {
      if (user.companyId !== null) throw new UnauthorizedException('Membresía inválida');
      return {
        id: user.id,
        email: user.email,
        username: null,
        loginName: user.email!,
        phone: user.phone,
        phoneVerifiedAt: user.phoneVerifiedAt,
        fullName: user.fullName,
        role: user.role,
        companyId: null,
        companySchema: null,
        companyLoginCode: null,
        mustChangePassword: user.mustChangePassword,
        sessionId: payload.jti,
        subscription: null,
      };
    }
    if (!user.companyId) throw new UnauthorizedException('Compañía requerida');
    const company = await this.companies.findOneBy({ id: user.companyId });
    if (!company?.isActive) throw new UnauthorizedException('Compañía inactiva');
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      loginName: `${user.username}@${company.loginCode}`,
      phone: user.phone,
      phoneVerifiedAt: user.phoneVerifiedAt,
      fullName: user.fullName,
      role: user.role,
      companyId: company.id,
      companySchema: company.schemaName,
      companyLoginCode: company.loginCode,
      mustChangePassword: user.mustChangePassword,
      sessionId: payload.jti,
      subscription: await this.subscriptions.getByCompanyId(company.id),
    };
  }
}
