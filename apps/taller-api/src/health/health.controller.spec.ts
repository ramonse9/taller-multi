import { ServiceUnavailableException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('reports readiness only when PostgreSQL responds', async () => {
    const query = jest.fn().mockResolvedValue([{ '?column?': 1 }]);
    const controller = new HealthController({ query } as unknown as DataSource);

    await expect(controller.check()).resolves.toEqual({ status: 'ok' });
    expect(query).toHaveBeenCalledWith('SELECT 1');
  });

  it('returns 503 while PostgreSQL is unavailable', async () => {
    const query = jest.fn().mockRejectedValue(new Error('connection refused'));
    const controller = new HealthController({ query } as unknown as DataSource);

    await expect(controller.check()).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
