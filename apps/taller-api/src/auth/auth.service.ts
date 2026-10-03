import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as argon2 from 'argon2';
import { DataSource, Repository } from 'typeorm';
import { Company } from '../companies/entities/company.entity';
import { PlatformRole, PlatformUser } from '../platform-users/entities/platform-user.entity';
import { LoginDto, LoginResponseDto } from './dto/login.dto';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { PermissionsService } from '../permissions/permissions.service';

@Injectable()
export class AuthService {
  private static readonly MAX_FAILED_ATTEMPTS = 5;
  private static readonly LOCK_MINUTES = 15;
  private static readonly DUMMY_PASSWORD_HASH =
    '$argon2id$v=19$m=65536,t=3,p=4$tX2A2IXFU7/xHXIGDL5EsQ$fI1U4ps+5za/GDAhYc3IRwCVi2obDcQrB7FZVtNM7kM';

  constructor(
    @InjectRepository(PlatformUser) private readonly users: Repository<PlatformUser>,
    @InjectRepository(Company) private readonly companies: Repository<Company>,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly dataSource: DataSource,
    private readonly subscriptions: SubscriptionsService,
    private readonly permissions: PermissionsService,
  ) {}

  async login(input: LoginDto): Promise<LoginResponseDto> {
    const user = await this.findUser(input.identifier);

    const invalid =
      !user || !user.isActive || (user.lockedUntil !== null && user.lockedUntil > new Date());
    const passwordValid = await argon2.verify(
      user?.passwordHash ?? AuthService.DUMMY_PASSWORD_HASH,
      input.password,
    );
    if (invalid || !passwordValid) {
      if (user && !passwordValid) await this.recordFailedAttempt(user);
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const company =
      user.role !== PlatformRole.PlatformAdmin && user.companyId
        ? await this.companies.findOneBy({ id: user.companyId })
        : null;
    if (user.role !== PlatformRole.PlatformAdmin) {
      if (!company?.isActive) throw new UnauthorizedException('Credenciales inválidas');
    }

    await this.users.update(user.id, { failedLoginAttempts: 0, lockedUntil: null });
    const sessionRows = await this.dataSource.query<Array<{ id: string }>>(
      'INSERT INTO public.auth_sessions(user_id) VALUES ($1) RETURNING id',
      [user.id],
    );
    const sessionId = sessionRows[0]?.id;
    if (!sessionId) throw new Error('No se pudo iniciar la sesión');
    const accessToken = await this.jwt.signAsync(
      { sub: user.id, jti: sessionId },
      {
        secret: this.config.getOrThrow<string>('JWT_SECRET'),
        issuer: this.config.getOrThrow<string>('JWT_ISSUER'),
        audience: this.config.getOrThrow<string>('JWT_AUDIENCE'),
        expiresIn: this.config.getOrThrow<string>('JWT_EXPIRES_IN') as never,
      },
    );
    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        loginName:
          user.role === PlatformRole.PlatformAdmin
            ? user.email!
            : `${user.username}@${company!.loginCode}`,
        phone: user.phone,
        phoneVerifiedAt: user.phoneVerifiedAt,
        fullName: user.fullName,
        role: user.role,
        companyId: user.companyId,
        mustChangePassword: user.mustChangePassword,
        subscription: company ? await this.subscriptions.getByCompanyId(company.id) : null,
        permissions: await this.permissions.forUser(user.id, user.role),
      },
    };
  }

  private async findUser(identifier: string): Promise<PlatformUser | null> {
    const platformUser = await this.users
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.role = :role AND user.email = :identifier', {
        role: PlatformRole.PlatformAdmin,
        identifier,
      })
      .getOne();
    if (platformUser) return platformUser;

    const separator = identifier.lastIndexOf('@');
    if (separator <= 0 || separator === identifier.length - 1) return null;
    const tenantUser = await this.users
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .innerJoin(Company, 'company', 'company.id = user.companyId')
      .where('user.username = :username AND company.loginCode = :loginCode', {
        username: identifier.slice(0, separator),
        loginCode: identifier.slice(separator + 1),
      })
      .getOne();
    if (tenantUser) return tenantUser;

    return this.users
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.role <> :role AND user.email = :identifier', {
        role: PlatformRole.PlatformAdmin,
        identifier,
      })
      .getOne();
  }

  private async recordFailedAttempt(user: PlatformUser): Promise<void> {
    const attempts = user.failedLoginAttempts + 1;
    const lockedUntil =
      attempts >= AuthService.MAX_FAILED_ATTEMPTS
        ? new Date(Date.now() + AuthService.LOCK_MINUTES * 60_000)
        : null;
    await this.users.update(user.id, { failedLoginAttempts: attempts, lockedUntil });
  }
}
