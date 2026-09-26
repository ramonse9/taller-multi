import { Compra } from "../entities/compra.entity";

export function mapCompra(c: Compra){

    return{
        id: c.id,
        subtotal: c.subtotal, 
        iva: c.iva, 
        total: c.total,
        //observaciones: c.observaciones, 
        estatus: c.estatus,
        fechaBorrador:      c.createdAt ? c.createdAt.toISOString() : '',
        fechaConfirmacion:  c.fechaConfirmacion ? c.fechaConfirmacion.toISOString() : '',
        fechaCancelacion:   c.fechaCancelacion ? c.fechaCancelacion.toISOString() : '',
        motivoCancelacion:  c.motivoCancelacion,
        createdAt: c.createdAt.toISOString(),

        proveedor:{
            id:     c.proveedor.id,
            nombre: c.proveedor.nombre
        },
        usuarioBorrador: {
            id:         c.usuarioBorrador ? c.usuarioBorrador.id : null,
            fullName:   c.usuarioBorrador ? c.usuarioBorrador.fullName : null,
        },
        usuarioConfirmacion: {
            id:         c.usuarioConfirmacion ? c.usuarioConfirmacion.id : null,
            fullName:   c.usuarioConfirmacion ? c.usuarioConfirmacion.fullName : null,
        },
        usuarioCancelacion: {
            id:         c.usuarioCancelacion ? c.usuarioCancelacion.id : null,
            fullName:   c.usuarioCancelacion ? c.usuarioCancelacion.fullName : null,
        },
        detalles: c.detalles.map( d => {
            
            return {
                id: d.id,
                cantidad: d.cantidad,
                costoUnitario: d.costoUnitario,
                subtotal: d.subtotal,
                producto: {
                    id: d.producto.id,
                    descripcion: d.producto.descripcion,
                    codigoBarras: d.producto.codigoBarras,
                    precioVenta: d.producto.precioVenta,
                    activo: d.producto.activo,
                }
            }

        })
         
    }


}