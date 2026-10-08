import {
  assertResetIsAuthorized,
  LegacyResetPlan,
  RESET_CONFIRMATION_PHRASE,
} from './reset-v1-to-v2';

const plan: LegacyResetPlan = {
  databaseName: 'taller_multi',
  databaseUser: 'taller_app',
  tenantSchemas: ['melkars'],
  otherConnectionCount: 0,
  v1Detected: true,
  v2Detected: false,
};

describe('assertResetIsAuthorized', () => {
  it('allows a production reset only with the exact phrase and database name', () => {
    expect(() =>
      assertResetIsAuthorized(plan, {
        execute: true,
        confirmation: RESET_CONFIRMATION_PHRASE,
        expectedDatabase: 'taller_multi',
        environment: 'production',
      }),
    ).not.toThrow();
  });

  it('keeps preview mode non-destructive without execution credentials', () => {
    expect(() =>
      assertResetIsAuthorized(plan, {
        execute: false,
        confirmation: undefined,
        expectedDatabase: undefined,
        environment: 'production',
      }),
    ).not.toThrow();
  });

  it.each([
    [
      'wrong confirmation',
      { confirmation: 'yes', expectedDatabase: 'taller_multi', otherConnectionCount: 0 },
    ],
    [
      'wrong database',
      {
        confirmation: RESET_CONFIRMATION_PHRASE,
        expectedDatabase: 'another_database',
        otherConnectionCount: 0,
      },
    ],
    [
      'open connections',
      {
        confirmation: RESET_CONFIRMATION_PHRASE,
        expectedDatabase: 'taller_multi',
        otherConnectionCount: 1,
      },
    ],
  ])('rejects execution with %s', (_name, scenario) => {
    expect(() =>
      assertResetIsAuthorized(
        { ...plan, otherConnectionCount: scenario.otherConnectionCount },
        {
          execute: true,
          confirmation: scenario.confirmation,
          expectedDatabase: scenario.expectedDatabase,
          environment: 'production',
        },
      ),
    ).toThrow();
  });

  it('refuses databases without the V1 marker or with V2 structures', () => {
    const authorization = {
      execute: false,
      confirmation: undefined,
      expectedDatabase: undefined,
      environment: 'production',
    };
    expect(() => assertResetIsAuthorized({ ...plan, v1Detected: false }, authorization)).toThrow(
      'V1 marker',
    );
    expect(() => assertResetIsAuthorized({ ...plan, v2Detected: true }, authorization)).toThrow(
      'V2 structures',
    );
  });

  it('allows tests only when the database name ends in _test', () => {
    expect(() =>
      assertResetIsAuthorized(
        { ...plan, databaseName: 'taller_multi_test' },
        {
          execute: false,
          confirmation: undefined,
          expectedDatabase: undefined,
          environment: 'test',
        },
      ),
    ).not.toThrow();
    expect(() =>
      assertResetIsAuthorized(plan, {
        execute: false,
        confirmation: undefined,
        expectedDatabase: undefined,
        environment: 'test',
      }),
    ).toThrow('ending in _test');
  });
});
