import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';
import { AuthenticatedUser } from '../common/types/authenticated-user';
import { Company } from '../companies/entities/company.entity';
import { PlatformRole, PlatformUser } from '../platform-users/entities/platform-user.entity';

interface JwtPayload {
  sub: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    @InjectRepository(PlatformUser) private readonly users: Repository<PlatformUser>,
    @InjectRepository(Company) private readonly companies: Repository<Company>,
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
    const user = await this.users.findOneBy({ id: payload.sub });
    if (!user?.isActive) throw new UnauthorizedException('Sesión inválida');

    if (user.role === PlatformRole.PlatformAdmin) {
      if (user.companyId !== null) throw new UnauthorizedException('Membresía inválida');
      return {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        companyId: null,
        companySchema: null,
        mustChangePassword: user.mustChangePassword,
      };
    }
    if (!user.companyId) throw new UnauthorizedException('Compañía requerida');
    const company = await this.companies.findOneBy({ id: user.companyId });
    if (!company?.isActive) throw new UnauthorizedException('Compañía inactiva');
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      companyId: company.id,
      companySchema: company.schemaName,
      mustChangePassword: user.mustChangePassword,
    };
  }
}
