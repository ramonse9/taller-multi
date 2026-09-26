import { EnumEstatusOrden } from "@shared/enums/general-estatus.enum";

export interface UpdateOrdenEstatusResponseDto {
  id: number;
  id_orden: string;
  estatus: EnumEstatusOrden;
  nota: string;
  createdAt: string;
}
