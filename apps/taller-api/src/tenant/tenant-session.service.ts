import { Injectable, UnauthorizedException } from '@nestjs/common';
import { DataSource, QueryRunner } from 'typeorm';
import { AuthenticatedUser } from '../common/types/authenticated-user';
import { normalizeAndValidateSchemaName } from '../database/schema-name';

@Injectable()
export class TenantSessionService {
  constructor(private readonly dataSource: DataSource) {}

  async run<T>(
    user: AuthenticatedUser,
    work: (runner: QueryRunner, schemaName: string) => Promise<T>,
  ): Promise<T> {
    if (!user.companyId) throw new UnauthorizedException('Compañía requerida');
    const runner = this.dataSource.createQueryRunner();
    await runner.connect();
    await runner.startTransaction();
    try {
      const companies = (await runner.query(
        'SELECT schema_name FROM public.companies WHERE id = $1 AND is_active = true',
        [user.companyId],
      )) as Array<{ schema_name: string }>;
      const company = companies[0];
      if (!company) throw new UnauthorizedException('Compañía inactiva');
      const schemaName = normalizeAndValidateSchemaName(company.schema_name);
      const result = await work(runner, schemaName);
      await runner.commitTransaction();
      return result;
    } catch (error: unknown) {
      await runner.rollbackTransaction();
      throw error;
    } finally {
      await runner.release();
    }
  }
}
