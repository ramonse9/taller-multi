import { CotizacionResponseDto } from "../dto/cotizacion-response.dto";
import { Cotizacion } from "../entities/cotizacion.entity";

export function mapCotizacionToResponseDto(c: Cotizacion): CotizacionResponseDto{
    return {
        ...c,
        updatedAt: c.updatedAt.toISOString(),
        createdAt: c.createdAt.toISOString()
    }
}