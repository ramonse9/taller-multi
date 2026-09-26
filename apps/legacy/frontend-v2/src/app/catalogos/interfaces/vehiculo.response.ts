import { PaginationResponse } from '@shared/interfaces/pagination.response';
import { Vehiculo } from './vehiculo.interface';

export interface VehiculosResponse extends PaginationResponse {
  vehiculos: Vehiculo[];
}
