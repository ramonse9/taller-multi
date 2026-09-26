import { Proveedor } from "@catalogos/interfaces/proveedor.interface";
import { EnumEstatusCompra } from "@shared/enums/general-estatus.enum";
import { CompraDetalle } from "./compra-detalle.interface";

interface ProveedorLite{
  id:           string;
  nombre:       string;
}

interface UsuarioLite{
  id:           string;
  fullName:     string;
}

interface ProductoLite{
  id:             string;
  descripcion:    string;
  codigoBarras:   string;
  precioVenta:    string;
  activo:         boolean;
}

export interface CompraDetalleLite{
  id:             string;
  cantidad:       number;
  costoUnitario:  number;
  subtotal:       number;
  producto:       ProductoLite;

}

export interface Compra{
  id:                   string;
  proveedor:            Proveedor;
  subtotal:             number;
  iva:                  number;
  total:                number;
  observaciones:        string;
  estatus:              EnumEstatusCompra;
  fechaBorrador:        string;
  fechaConfirmacion:    string;
  fechaCancelacion:     string;
  motivoCancelacion:    string;
  createdAt:            string,
  usuarioBorrador:      UsuarioLite;
  usuarioConfirmacion:  UsuarioLite;
  usuarioCancelacion:   UsuarioLite;
  detalles:             CompraDetalle[];
}

export interface CompraLite extends Omit<Compra, 'proveedor' | 'detalles'>{
  proveedor:       ProveedorLite;
  detalles:        CompraDetalleLite[];
}
