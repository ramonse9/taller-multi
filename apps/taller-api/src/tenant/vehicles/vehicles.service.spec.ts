import { BadRequestException, NotFoundException } from '@nestjs/common';
import { QueryRunner } from 'typeorm';
import { PlatformRole } from '../../platform-users/entities/platform-user.entity';
import { TenantSessionService } from '../tenant-session.service';
import { VehiclesService } from './vehicles.service';

const user = {
  id: 'b9853a5f-c3f2-4096-a379-973b8ed43fea',
  email: null,
  username: 'user',
  loginName: 'user@alpha',
  phone: '+526671234567',
  phoneVerifiedAt: null,
  fullName: 'Test User',
  role: PlatformRole.User,
  companyId: '05b8405a-d628-4a6f-bdc1-414ac4ef025a',
  companyName: 'Tenant Alpha',
  companySchema: 'tenant_alpha',
  companyLoginCode: 'alpha',
  mustChangePassword: false,
  sessionId: '76fbd920-c8c7-4bc4-83e7-b6557382a53a',
  subscription: null,
  permissions: [],
};

const clientId = '983119b6-d8f-4d6a-aa4c-c7086974b110';
const vehicleId = '576ef374-87fc-4975-a48f-2f17754d0986';
const brandId = '45e6b25c-e4a7-4c7c-bf81-41839db98979';
const modelId = '6f60a427-b9fe-45d4-b162-ceaa97a76e04';
const row = {
  id: vehicleId,
  customer_id: clientId,
  brand_id: brandId,
  brand_name: 'Toyota',
  model_id: modelId,
  model_name: 'Corolla',
  model_year: 2024,
  color: 'Blanco',
  serial_number: 'A123456789',
  license_plate: null,
  is_active: true,
  created_by_user_id: user.id,
  updated_by_user_id: user.id,
  created_at: new Date('2026-01-01T00:00:00Z'),
  updated_at: new Date('2026-01-01T00:00:00Z'),
};

describe('VehiclesService', () => {
  const query = jest.fn<Promise<unknown[]>, [string, unknown[]?]>();
  const runner = { query } as unknown as QueryRunner;
  const tenant = {
    run: <T>(
      _user: unknown,
      work: (activeRunner: QueryRunner, schemaName: string) => Promise<T>,
    ): Promise<T> => work(runner, 'tenant_alpha'),
  } as TenantSessionService;
  const service = new VehiclesService(tenant);

  beforeEach(() => query.mockReset());

  it('creates a tenant vehicle without odometer and exposes numeroSerie', async () => {
    query
      .mockResolvedValueOnce([{ is_active: true }])
      .mockResolvedValueOnce([{ brand_active: true, model_active: true }])
      .mockResolvedValueOnce([{ id: vehicleId }])
      .mockResolvedValueOnce([row]);

    const result = await service.create(user, clientId, {
      brandId,
      modelId,
      year: 2024,
      color: 'Blanco',
      numeroSerie: 'A123456789',
      licensePlate: null,
    });

    expect(result).toMatchObject({ numeroSerie: 'A123456789', year: 2024, color: 'Blanco' });
    expect(query.mock.calls[2]?.[0]).not.toContain('odometer');
    expect(query.mock.calls[2]?.[1]).toEqual([
      clientId,
      brandId,
      modelId,
      2024,
      'Blanco',
      'A123456789',
      null,
      user.id,
    ]);
  });

  it('rejects a model from a different brand', async () => {
    query.mockResolvedValueOnce([{ is_active: true }]).mockResolvedValueOnce([]);

    await expect(
      service.create(user, clientId, {
        brandId,
        modelId,
        year: 2024,
        color: 'Blanco',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('does not find a vehicle outside the client in the active tenant', async () => {
    query.mockResolvedValueOnce([]);
    await expect(service.getOne(user, clientId, vehicleId)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(query.mock.calls[0]?.[0]).toContain('vehicle.customer_id = $2');
  });

  it('groups every client and order matching a serial number', async () => {
    const secondVehicleId = '8e0e8dc5-17c3-4bdf-9654-bdf39f1a53c4';
    const secondClientId = '1574568e-e623-445f-a601-54654854f519';
    query.mockResolvedValueOnce([
      {
        ...row,
        customer_name: 'Juan Pérez',
        order_id: '0080e9f2-4d29-499b-bd17-70778bb9b08a',
        order_folio: '10',
        order_status: 'completed',
        order_opened_at: new Date('2025-01-01T00:00:00Z'),
        order_closed_at: new Date('2025-01-02T00:00:00Z'),
      },
      {
        ...row,
        id: secondVehicleId,
        customer_id: secondClientId,
        customer_name: 'Pedro García',
        order_id: 'df346e74-2256-45d0-966f-1c1538b493ab',
        order_folio: '42',
        order_status: 'open',
        order_opened_at: new Date('2026-01-01T00:00:00Z'),
        order_closed_at: null,
      },
    ]);

    const result = await service.history(user, { numeroSerie: 'A123456789' });

    expect(result).toMatchObject({ totalClients: 2, totalVehicles: 2, totalOrders: 2 });
    expect(result.matches.map(({ customerName }) => customerName)).toEqual([
      'Juan Pérez',
      'Pedro García',
    ]);
    expect(query.mock.calls[0]?.[0]).toContain('vehicle.serial_number = $1');
    expect(query.mock.calls[0]?.[1]).toEqual(['A123456789', null]);
  });
});
