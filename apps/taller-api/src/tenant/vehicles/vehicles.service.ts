import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { QueryFailedError, QueryRunner } from 'typeorm';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { quoteIdentifier } from '../../database/schema-name';
import { TenantSessionService } from '../tenant-session.service';
import { CreateVehicleDto, UpdateVehicleDto, VehicleResponseDto } from './dto/vehicle.dto';

interface VehicleRow {
  id: string;
  customer_id: string;
  brand_id: string;
  brand_name: string;
  model_id: string;
  model_name: string;
  model_year: number;
  color: string;
  serial_number: string | null;
  license_plate: string | null;
  is_active: boolean;
  created_by_user_id: string;
  updated_by_user_id: string;
  created_at: Date;
  updated_at: Date;
}

const VEHICLE_COLUMNS = `vehicle.id, vehicle.customer_id, vehicle.brand_id,
  brand.name AS brand_name, vehicle.model_id, model.name AS model_name,
  vehicle.model_year, vehicle.color, vehicle.serial_number, vehicle.license_plate,
  vehicle.is_active, vehicle.created_by_user_id, vehicle.updated_by_user_id,
  vehicle.created_at, vehicle.updated_at`;

@Injectable()
export class VehiclesService {
  constructor(private readonly tenant: TenantSessionService) {}

  list(user: AuthenticatedUser, clientId: string): Promise<VehicleResponseDto[]> {
    return this.tenant.run(user, async (runner, schema) => {
      await this.requireClient(runner, schema, clientId);
      const rows = (await runner.query(
        `${this.selectFrom(schema)} WHERE vehicle.customer_id = $1
         ORDER BY vehicle.created_at DESC, vehicle.id DESC`,
        [clientId],
      )) as VehicleRow[];
      return rows.map((row) => this.toResponse(row));
    });
  }

  getOne(user: AuthenticatedUser, clientId: string, id: string): Promise<VehicleResponseDto> {
    return this.tenant.run(user, async (runner, schema) => {
      const row = await this.findOne(runner, schema, clientId, id);
      if (!row) throw new NotFoundException('Vehículo no encontrado');
      return this.toResponse(row);
    });
  }

  create(
    user: AuthenticatedUser,
    clientId: string,
    input: CreateVehicleDto,
  ): Promise<VehicleResponseDto> {
    return this.tenant.run(user, async (runner, schema) => {
      await this.requireClient(runner, schema, clientId, true);
      await this.requireCatalogPair(runner, input.brandId, input.modelId, true);
      try {
        const rows = (await runner.query(
          `INSERT INTO ${quoteIdentifier(schema)}.vehicles
            (customer_id, brand_id, model_id, model_year, color, serial_number,
             license_plate, created_by_user_id, updated_by_user_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8)
           RETURNING id`,
          [
            clientId,
            input.brandId,
            input.modelId,
            input.year,
            input.color,
            input.numeroSerie ?? null,
            input.licensePlate ?? null,
            user.id,
          ],
        )) as Array<{ id: string }>;
        return this.getRequired(runner, schema, clientId, rows[0]!.id);
      } catch (error: unknown) {
        this.rethrowConstraint(error);
      }
    });
  }

  update(
    user: AuthenticatedUser,
    clientId: string,
    id: string,
    input: UpdateVehicleDto,
  ): Promise<VehicleResponseDto> {
    return this.tenant.run(user, async (runner, schema) => {
      const current = await this.findOne(runner, schema, clientId, id);
      if (!current) throw new NotFoundException('Vehículo no encontrado');
      const brandId = input.brandId ?? current.brand_id;
      const modelId = input.modelId ?? current.model_id;
      await this.requireCatalogPair(runner, brandId, modelId, input.isActive ?? current.is_active);
      try {
        await runner.query(
          `UPDATE ${quoteIdentifier(schema)}.vehicles SET
             brand_id = $3, model_id = $4, model_year = $5, color = $6,
             serial_number = $7, license_plate = $8, is_active = $9,
             updated_by_user_id = $10, updated_at = now()
           WHERE id = $1 AND customer_id = $2`,
          [
            id,
            clientId,
            brandId,
            modelId,
            input.year ?? current.model_year,
            input.color ?? current.color,
            input.numeroSerie === undefined ? current.serial_number : input.numeroSerie,
            input.licensePlate === undefined ? current.license_plate : input.licensePlate,
            input.isActive ?? current.is_active,
            user.id,
          ],
        );
        return this.getRequired(runner, schema, clientId, id);
      } catch (error: unknown) {
        this.rethrowConstraint(error);
      }
    });
  }

  private selectFrom(schema: string): string {
    return `SELECT ${VEHICLE_COLUMNS}
      FROM ${quoteIdentifier(schema)}.vehicles vehicle
      JOIN public.vehicle_brands brand ON brand.id = vehicle.brand_id
      JOIN public.vehicle_models model ON model.id = vehicle.model_id`;
  }

  private async findOne(
    runner: QueryRunner,
    schema: string,
    clientId: string,
    id: string,
  ): Promise<VehicleRow | undefined> {
    const rows = (await runner.query(
      `${this.selectFrom(schema)} WHERE vehicle.id = $1 AND vehicle.customer_id = $2`,
      [id, clientId],
    )) as VehicleRow[];
    return rows[0];
  }

  private async getRequired(
    runner: QueryRunner,
    schema: string,
    clientId: string,
    id: string,
  ): Promise<VehicleResponseDto> {
    const row = await this.findOne(runner, schema, clientId, id);
    if (!row) throw new Error('No se pudo consultar el vehículo guardado');
    return this.toResponse(row);
  }

  private async requireClient(
    runner: QueryRunner,
    schema: string,
    clientId: string,
    requireActive = false,
  ): Promise<void> {
    const rows = (await runner.query(
      `SELECT is_active FROM ${quoteIdentifier(schema)}.customers WHERE id = $1`,
      [clientId],
    )) as Array<{ is_active: boolean }>;
    if (!rows[0]) throw new NotFoundException('Cliente no encontrado');
    if (requireActive && !rows[0].is_active)
      throw new BadRequestException('No se pueden registrar vehículos para un cliente inactivo');
  }

  private async requireCatalogPair(
    runner: QueryRunner,
    brandId: string,
    modelId: string,
    requireActive: boolean,
  ): Promise<void> {
    const rows = (await runner.query(
      `SELECT brand.is_active AS brand_active, model.is_active AS model_active
       FROM public.vehicle_brands brand
       JOIN public.vehicle_models model ON model.brand_id = brand.id
       WHERE brand.id = $1 AND model.id = $2`,
      [brandId, modelId],
    )) as Array<{ brand_active: boolean; model_active: boolean }>;
    if (!rows[0]) throw new BadRequestException('El modelo no pertenece a la marca seleccionada');
    if (requireActive && (!rows[0].brand_active || !rows[0].model_active))
      throw new BadRequestException('La marca y el modelo deben estar activos');
  }

  private rethrowConstraint(error: unknown): never {
    if (error instanceof QueryFailedError) {
      const code = (error.driverError as { code?: string; constraint?: string }).code;
      const constraint = (error.driverError as { constraint?: string }).constraint;
      if (code === '23505') {
        if (constraint?.includes('serial_number'))
          throw new ConflictException('El número de serie ya está registrado');
        if (constraint?.includes('license_plate'))
          throw new ConflictException('La placa ya está registrada');
        throw new ConflictException('Ya existe un vehículo con esos datos');
      }
      if (code === '23503') throw new BadRequestException('Cliente, marca o modelo inválido');
    }
    throw error;
  }

  private toResponse(row: VehicleRow): VehicleResponseDto {
    return {
      id: row.id,
      customerId: row.customer_id,
      brandId: row.brand_id,
      brandName: row.brand_name,
      modelId: row.model_id,
      modelName: row.model_name,
      year: row.model_year,
      color: row.color,
      numeroSerie: row.serial_number,
      licensePlate: row.license_plate,
      isActive: row.is_active,
      createdByUserId: row.created_by_user_id,
      updatedByUserId: row.updated_by_user_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
