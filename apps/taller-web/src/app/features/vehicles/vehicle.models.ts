export interface Vehicle {
  id: string;
  customerId: string;
  brandId: string;
  brandName: string;
  modelId: string;
  modelName: string;
  year: number;
  color: string;
  numeroSerie: string | null;
  licensePlate: string | null;
  isActive: boolean;
  createdByUserId: string;
  updatedByUserId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVehicleInput {
  brandId: string;
  modelId: string;
  year: number;
  color: string;
  numeroSerie: string | null;
  licensePlate: string | null;
}

export interface UpdateVehicleInput extends Partial<CreateVehicleInput> {
  isActive?: boolean;
}

export interface VehicleHistoryOrder {
  id: string;
  folio: string;
  status: string;
  openedAt: string;
  closedAt: string | null;
}

export interface VehicleHistoryMatch extends Vehicle {
  customerName: string;
  orders: VehicleHistoryOrder[];
}

export interface VehicleHistory {
  numeroSerie: string;
  brandId: string | null;
  totalClients: number;
  totalVehicles: number;
  totalOrders: number;
  matches: VehicleHistoryMatch[];
}
