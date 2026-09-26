import { PaginationResponse } from "@shared/interfaces/pagination.response";
import { Empleado } from "./empleado.interface";

export interface EmpleadosResponse extends PaginationResponse{

  empleados: Empleado[]
}
