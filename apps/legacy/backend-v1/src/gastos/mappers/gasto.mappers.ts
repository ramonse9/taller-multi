import { Gasto } from "../entities/gasto.entity";
import { GastoMovimiento } from '../entities/gasto_movimiento.entity';
import { GastoMovimientoResponseDto } from "../dto/gasto-movimiento-response.dto";
import { GastoCategoriaResponseDto } from "../dto/gasto-categoria-response.dto";
import { GastoCategoria } from "../entities/gasto_categoria.entity";
import { GastoResponseDto } from "../dto/gasto-response.dto";

export function mapGastoCategoriaToResponseDto( gc: GastoCategoria): GastoCategoriaResponseDto{
    return {
        ...gc
    }
}

export function mapGastoToResponseDto( g: Gasto): GastoResponseDto{
    return {
        ...g,
        gastoCategoria: g.gastoCategoria,
        updatedAt: g.updatedAt.toISOString(),
        createdAt: g.createdAt.toISOString()
    }

}

export function mapGastoMovimientoToResponseDto( g: GastoMovimiento): GastoMovimientoResponseDto{
    return {
        ...g,
        gasto: mapGastoToResponseDto( g.gasto),
        fecha: new Date( g.fecha ).toISOString(),
        updatedAt: g.updatedAt.toISOString(),
        createdAt: g.createdAt.toISOString()
    }

}

/*
export const mapGastoToResponseWithMovimientosDto = (gasto: any): GastoConMovimientosResponseDto => {
  return {
    id: gasto.id,
    nombre: gasto.nombre,
    recurrente: gasto.recurrente,
    activo: concepto.activo,
    gastoCategoria: concepto.gastoCategoria,
    createdAt: concepto.createdAt,
    updatedAt: concepto.updatedAt,
    gastos: concepto.gastos || [],
    totalGastado: concepto.totalGastado || 0
  };
};*/