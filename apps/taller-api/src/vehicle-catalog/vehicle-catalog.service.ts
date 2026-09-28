import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { DataSource, QueryFailedError } from 'typeorm';
import { AuthenticatedUser } from '../common/types/authenticated-user';
import {
  CreateVehicleBrandDto,
  CreateVehicleModelDto,
  PaginatedVehicleBrandsDto,
  PaginatedVehicleModelsDto,
  UpdateVehicleBrandDto,
  UpdateVehicleModelDto,
  VehicleBrandResponseDto,
  VehicleCatalogQueryDto,
  VehicleModelQueryDto,
  VehicleModelResponseDto,
} from './dto/vehicle-catalog.dto';

interface BrandRow {
  id: string;
  name: string;
  is_active: boolean;
  created_by_user_id: string | null;
  created_at: Date;
  updated_at: Date;
}

interface ModelRow extends BrandRow {
  brand_id: string;
  brand_name: string;
}

@Injectable()
export class VehicleCatalogService {
  constructor(private readonly dataSource: DataSource) {}

  async listBrands(query: VehicleCatalogQueryDto): Promise<PaginatedVehicleBrandsDto> {
    const search = this.searchPattern(query.search);
    const offset = (query.page - 1) * query.limit;
    const parameters = [query.isActive, search];
    const countRows = await this.dataSource.query<Array<{ total: string }>>(
      `SELECT COUNT(*) AS total
       FROM public.vehicle_brands
       WHERE is_active = $1 AND ($2 = '%%' OR name ILIKE $2 ESCAPE '\\')`,
      parameters,
    );
    const totalItems = Number(countRows[0]?.total ?? 0);
    const rows = await this.dataSource.query<BrandRow[]>(
      `SELECT id, name, is_active, created_by_user_id, created_at, updated_at
       FROM public.vehicle_brands
       WHERE is_active = $1 AND ($2 = '%%' OR name ILIKE $2 ESCAPE '\\')
       ORDER BY name, id
       LIMIT $3 OFFSET $4`,
      [...parameters, query.limit, offset],
    );
    return this.brandPage(rows, query, totalItems);
  }

  async getBrand(id: string): Promise<VehicleBrandResponseDto> {
    const rows = await this.dataSource.query<BrandRow[]>(
      `SELECT id, name, is_active, created_by_user_id, created_at, updated_at
       FROM public.vehicle_brands WHERE id = $1`,
      [id],
    );
    if (!rows[0]) throw new NotFoundException('Marca no encontrada');
    return this.toBrand(rows[0]);
  }

  async createBrand(
    user: AuthenticatedUser,
    input: CreateVehicleBrandDto,
  ): Promise<VehicleBrandResponseDto> {
    try {
      const rows = await this.dataSource.query<BrandRow[]>(
        `INSERT INTO public.vehicle_brands(name, created_by_user_id, updated_by_user_id)
         VALUES ($1, $2, $2)
         RETURNING id, name, is_active, created_by_user_id, created_at, updated_at`,
        [input.name, user.id],
      );
      if (!rows[0]) throw new Error('No se pudo crear la marca');
      return this.toBrand(rows[0]);
    } catch (error) {
      this.rethrowDuplicate(error, 'La marca ya está registrada');
      throw error;
    }
  }

  async updateBrand(
    user: AuthenticatedUser,
    id: string,
    input: UpdateVehicleBrandDto,
  ): Promise<VehicleBrandResponseDto> {
    const { assignments, values } = this.updateAssignments(input);
    if (assignments.length === 0) throw new BadRequestException('No hay cambios para aplicar');
    values.push(user.id, id);
    try {
      const result = await this.dataSource.query<[BrandRow[], number]>(
        `UPDATE public.vehicle_brands
         SET ${assignments.join(', ')}, updated_by_user_id = $${values.length - 1}, updated_at = NOW()
         WHERE id = $${values.length}
         RETURNING id, name, is_active, created_by_user_id, created_at, updated_at`,
        values,
      );
      const updated = result[0][0];
      if (!updated) throw new NotFoundException('Marca no encontrada');
      return this.toBrand(updated);
    } catch (error) {
      this.rethrowDuplicate(error, 'La marca ya está registrada');
      throw error;
    }
  }

  deactivateBrand(user: AuthenticatedUser, id: string): Promise<VehicleBrandResponseDto> {
    return this.updateBrand(user, id, { isActive: false });
  }

  async listModels(query: VehicleModelQueryDto): Promise<PaginatedVehicleModelsDto> {
    await this.getBrand(query.brandId);
    const search = this.searchPattern(query.search);
    const offset = (query.page - 1) * query.limit;
    const parameters = [query.brandId, query.isActive, search];
    const countRows = await this.dataSource.query<Array<{ total: string }>>(
      `SELECT COUNT(*) AS total
       FROM public.vehicle_models
       WHERE brand_id = $1 AND is_active = $2
         AND ($3 = '%%' OR name ILIKE $3 ESCAPE '\\')`,
      parameters,
    );
    const totalItems = Number(countRows[0]?.total ?? 0);
    const rows = await this.dataSource.query<ModelRow[]>(
      `SELECT model.id, model.brand_id, model.name, model.is_active,
              model.created_by_user_id, model.created_at, model.updated_at,
              brand.name AS brand_name
       FROM public.vehicle_models model
       JOIN public.vehicle_brands brand ON brand.id = model.brand_id
       WHERE model.brand_id = $1 AND model.is_active = $2
         AND ($3 = '%%' OR model.name ILIKE $3 ESCAPE '\\')
       ORDER BY model.name, model.id
       LIMIT $4 OFFSET $5`,
      [...parameters, query.limit, offset],
    );
    return this.modelPage(rows, query, totalItems);
  }

  async getModel(id: string): Promise<VehicleModelResponseDto> {
    const rows = await this.dataSource.query<ModelRow[]>(
      `SELECT model.id, model.brand_id, model.name, model.is_active,
              model.created_by_user_id, model.created_at, model.updated_at,
              brand.name AS brand_name
       FROM public.vehicle_models model
       JOIN public.vehicle_brands brand ON brand.id = model.brand_id
       WHERE model.id = $1`,
      [id],
    );
    if (!rows[0]) throw new NotFoundException('Modelo no encontrado');
    return this.toModel(rows[0]);
  }

  async createModel(
    user: AuthenticatedUser,
    input: CreateVehicleModelDto,
  ): Promise<VehicleModelResponseDto> {
    const brand = await this.getBrand(input.brandId);
    if (!brand.isActive) throw new UnprocessableEntityException('La marca está desactivada');
    try {
      const rows = await this.dataSource.query<ModelRow[]>(
        `INSERT INTO public.vehicle_models(
           brand_id, name, created_by_user_id, updated_by_user_id
         ) VALUES ($1, $2, $3, $3)
         RETURNING id, brand_id, name, is_active, created_by_user_id, created_at, updated_at,
                   $4::text AS brand_name`,
        [input.brandId, input.name, user.id, brand.name],
      );
      if (!rows[0]) throw new Error('No se pudo crear el modelo');
      return this.toModel(rows[0]);
    } catch (error) {
      this.rethrowDuplicate(error, 'El modelo ya está registrado para esta marca');
      throw error;
    }
  }

  async updateModel(
    user: AuthenticatedUser,
    id: string,
    input: UpdateVehicleModelDto,
  ): Promise<VehicleModelResponseDto> {
    const current = await this.getModel(id);
    if (input.isActive === true) {
      const brand = await this.getBrand(current.brandId);
      if (!brand.isActive) throw new UnprocessableEntityException('La marca está desactivada');
    }
    const { assignments, values } = this.updateAssignments(input);
    if (assignments.length === 0) throw new BadRequestException('No hay cambios para aplicar');
    values.push(user.id, id);
    try {
      const result = await this.dataSource.query<[ModelRow[], number]>(
        `UPDATE public.vehicle_models model
         SET ${assignments.join(', ')}, updated_by_user_id = $${values.length - 1}, updated_at = NOW()
         FROM public.vehicle_brands brand
         WHERE model.id = $${values.length} AND brand.id = model.brand_id
         RETURNING model.id, model.brand_id, model.name, model.is_active,
                   model.created_by_user_id, model.created_at, model.updated_at,
                   brand.name AS brand_name`,
        values,
      );
      const updated = result[0][0];
      if (!updated) throw new NotFoundException('Modelo no encontrado');
      return this.toModel(updated);
    } catch (error) {
      this.rethrowDuplicate(error, 'El modelo ya está registrado para esta marca');
      throw error;
    }
  }

  deactivateModel(user: AuthenticatedUser, id: string): Promise<VehicleModelResponseDto> {
    return this.updateModel(user, id, { isActive: false });
  }

  private updateAssignments(input: UpdateVehicleBrandDto | UpdateVehicleModelDto): {
    assignments: string[];
    values: unknown[];
  } {
    const assignments: string[] = [];
    const values: unknown[] = [];
    if (input.name !== undefined) {
      values.push(input.name);
      assignments.push(`name = $${values.length}`);
    }
    if (input.isActive !== undefined) {
      values.push(input.isActive);
      assignments.push(`is_active = $${values.length}`);
    }
    return { assignments, values };
  }

  private brandPage(
    rows: BrandRow[],
    query: VehicleCatalogQueryDto,
    totalItems: number,
  ): PaginatedVehicleBrandsDto {
    return {
      page: query.page,
      limit: query.limit,
      totalItems,
      totalPages: totalItems === 0 ? 0 : Math.ceil(totalItems / query.limit),
      hasNextPage: (query.page - 1) * query.limit + rows.length < totalItems,
      items: rows.map((row) => this.toBrand(row)),
    };
  }

  private modelPage(
    rows: ModelRow[],
    query: VehicleModelQueryDto,
    totalItems: number,
  ): PaginatedVehicleModelsDto {
    return {
      page: query.page,
      limit: query.limit,
      totalItems,
      totalPages: totalItems === 0 ? 0 : Math.ceil(totalItems / query.limit),
      hasNextPage: (query.page - 1) * query.limit + rows.length < totalItems,
      items: rows.map((row) => this.toModel(row)),
    };
  }

  private toBrand(row: BrandRow): VehicleBrandResponseDto {
    return {
      id: row.id,
      name: row.name,
      isActive: row.is_active,
      createdByUserId: row.created_by_user_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private toModel(row: ModelRow): VehicleModelResponseDto {
    return {
      ...this.toBrand(row),
      brandId: row.brand_id,
      brandName: row.brand_name,
    };
  }

  private searchPattern(search: string): string {
    return `%${search.replace(/[\\%_]/g, '\\$&')}%`;
  }

  private rethrowDuplicate(error: unknown, message: string): void {
    if (
      error instanceof QueryFailedError &&
      (error.driverError as { code?: string }).code === '23505'
    ) {
      throw new ConflictException(message);
    }
  }
}
