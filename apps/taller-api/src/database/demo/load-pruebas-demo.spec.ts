import { assertDemoLoadAuthorization } from './load-pruebas-demo';

describe('assertDemoLoadAuthorization', () => {
  it('permite previsualizar sin confirmaciones', () => {
    expect(() => assertDemoLoadAuthorization({ apply: false })).not.toThrow();
  });

  it('exige confirmar exactamente la compañía pruebas', () => {
    expect(() =>
      assertDemoLoadAuthorization({
        apply: true,
        confirmation: 'otra',
        databaseUrl: 'postgresql://user:password@localhost:5432/taller',
      }),
    ).toThrow('La carga requiere --confirm=pruebas');
  });

  it('permite cargar localmente con la confirmación de compañía', () => {
    expect(() =>
      assertDemoLoadAuthorization({
        apply: true,
        confirmation: 'pruebas',
        databaseUrl: 'postgresql://user:password@127.0.0.1:5432/taller',
        environment: 'development',
      }),
    ).not.toThrow();
  });

  it('exige una segunda confirmación para producción o una base remota', () => {
    expect(() =>
      assertDemoLoadAuthorization({
        apply: true,
        confirmation: 'pruebas',
        databaseUrl: 'postgresql://user:password@database.example.com:5432/taller',
        environment: 'production',
      }),
    ).toThrow('La carga contra una base remota requiere');

    expect(() =>
      assertDemoLoadAuthorization({
        apply: true,
        confirmation: 'pruebas',
        productionConfirmation: 'LOAD_PRUEBAS_DEMO',
        databaseUrl: 'postgresql://user:password@database.example.com:5432/taller',
        environment: 'production',
      }),
    ).not.toThrow();
  });
});
