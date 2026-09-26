import { OrdenResponseDto } from "../dto/orden-response.dto";
import { Orden } from "../entities/orden.entity";

/* TODO */
export function mapOrdenToResponseDto( o: Orden){ //: OrdenResponseDto{
    return {    
        ...o,
        fechaIngreso: o.fechaIngreso.toISOString(),
        fechaPago: o.fechaPago ? o.fechaPago.toISOString() : '',
        fechaEntregaReal: o.fechaEntregaReal ? o.fechaEntregaReal.toISOString() : '',
        fechaLiquidacion: o.fechaLiquidacion ? o.fechaLiquidacion.toISOString() : '',
        updatedAt: o.updatedAt.toISOString(),
        createdAt: o.createdAt.toISOString()
    }

}