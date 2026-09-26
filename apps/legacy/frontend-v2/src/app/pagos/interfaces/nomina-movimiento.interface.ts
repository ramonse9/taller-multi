import { EnumNominaMovimientoEstatus } from "@shared/enums/general-estatus.enum";
import { NominaMovimientoDetalle } from "./nomina-movimiento-detalle.interface";

export interface NominaMovimiento {
  id:                   string;
  salarioBase:          string;
  totalPercepciones:    string;
  totalDeducciones:     string;
  totalNeto:            string;
  fecha:                string;
  estatus:              EnumNominaMovimientoEstatus;
  detalles:             NominaMovimientoDetalle[];
}


/*
movimientoId": "mov000003",

                    "empleadoId": "emp000004",
                    "nombre": "Ezequiel Fregoso",
                    "salarioBase": "5670.00",
                    "percepciones": 0,
                    "deducciones": 0,
                    "neto": 5670,
                    "estado": "activo"

                    */