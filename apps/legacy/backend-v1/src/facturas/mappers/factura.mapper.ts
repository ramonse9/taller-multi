import { FacturaSinLiquidarResponseDto } from "../dto/factura-sin-liquidar-response.dto";
import { PagoResponseDto } from "../dto/pago-response.dto";

export interface PagoRAW{
    pago_numero_parcialidad: number,
    pago_saldo_anterior: string,
    pago_monto: string,
    pago_saldo_insoluto: string,
    complemento_fecha_emision: Date,
    complemento_fecha_pago: Date,
    satFormaPago_clave: string,
    satFormaPago_descripcion: string
}

export function mapPagoToResponseDto( p: PagoRAW ): PagoResponseDto{

    return {
        numeroParcialidad: p.pago_numero_parcialidad,
        saldoAnterior: Number( p.pago_saldo_anterior ),
        monto: Number( p.pago_monto),
        saldoInsoluto: Number( p.pago_saldo_insoluto ),
        complemento: {
            fechaEmision: p.complemento_fecha_emision.toISOString(),
            fechaPago: p.complemento_fecha_pago.toISOString(),
            satFormaPago: {
                clave: p.satFormaPago_clave,
                descripcion: p.satFormaPago_descripcion
            }
        }
    }
}

export interface FacturaSinLiquidarRAW{
    factura_id: string,
    factura_uuid: string,
    factura_total: string,
    orden_id: string
}

export function mapFacturaSinLiquidarToResponseDto( f: FacturaSinLiquidarRAW ): FacturaSinLiquidarResponseDto{

    return {
        id:       f.factura_id,
        uuid:     f.factura_uuid,
        total:    Number( f.factura_total ),
        orden: {  
            id: f.orden_id
        }
    }

}