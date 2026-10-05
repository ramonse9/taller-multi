import { Controller, ExecutionContext, Get, INestApplication, Post } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { Server } from 'http';
import { SensitiveRateLimit, shouldSkipSensitiveRateLimit } from './sensitive-rate-limit.decorator';

class TestController {
  @SensitiveRateLimit()
  sensitive(this: void): void {}

  regular(this: void): void {}
}

@Controller('rate-limit-test')
class RateLimitTestController {
  @Post('sensitive')
  @SensitiveRateLimit()
  sensitive(this: void): { accepted: true } {
    return { accepted: true };
  }

  @Get('regular')
  regular(this: void): { accepted: true } {
    return { accepted: true };
  }
}

function contextFor(handler: () => void): ExecutionContext {
  return {
    getHandler: () => handler,
  } as unknown as ExecutionContext;
}

describe('SensitiveRateLimit', () => {
  it('marca únicamente las operaciones sensibles', () => {
    expect(shouldSkipSensitiveRateLimit(contextFor(TestController.prototype.sensitive))).toBe(
      false,
    );
    expect(shouldSkipSensitiveRateLimit(contextFor(TestController.prototype.regular))).toBe(true);
  });

  it('bloquea el cuarto intento sensible sin limitar una ruta regular', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot({
          throttlers: [
            { name: 'default', ttl: 60_000, limit: 100 },
            {
              name: 'sensitive',
              ttl: 60_000,
              limit: 3,
              skipIf: shouldSkipSensitiveRateLimit,
            },
          ],
        }),
      ],
      controllers: [RateLimitTestController],
      providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
    }).compile();
    const app: INestApplication = moduleRef.createNestApplication();

    try {
      await app.listen(0, '127.0.0.1');
      const address = (app.getHttpServer() as Server).address();
      if (!address || typeof address === 'string') throw new Error('Test server did not start');
      const url = `http://127.0.0.1:${address.port}/rate-limit-test`;

      for (let attempt = 0; attempt < 3; attempt += 1) {
        expect((await fetch(`${url}/sensitive`, { method: 'POST' })).status).toBe(201);
      }
      expect((await fetch(`${url}/sensitive`, { method: 'POST' })).status).toBe(429);

      for (let attempt = 0; attempt < 4; attempt += 1) {
        expect((await fetch(`${url}/regular`)).status).toBe(200);
      }
    } finally {
      await app.close();
    }
  });
});
