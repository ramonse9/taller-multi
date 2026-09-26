import { EnumEstatusConceptoOrden, EnumEstatusConcepto, EnumOrdenConceptoTipo } from './../../commom/enums/general.enum';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Orden } from "./orden.entity";
import { ProductoServicio } from '../../productos-servicios/entities/producto-servicio.entity';
import { Producto } from '../../productos/entities/producto.entity';
import { Servicio } from '../../servicios/entities/servicio.entity';

@Entity('pri_ordenes_conceptos')
export class OrdenConcepto{
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'enum', enum: EnumOrdenConceptoTipo })
    tipo: EnumOrdenConceptoTipo;

    @Column()
    cantidad: number;
    
    @Column({ type: 'decimal', precision: 12, scale: 2, name: 'costo_unitario_promedio_snapshot', nullable: true })
    costoUnitarioPromedioSnapshot: number;
    
    @Column({ type: 'decimal', precision: 12, scale: 2, name: 'subtotal_costo_snapshot', nullable: true })
    subtotalCostoSnapshot: number;

    @Column({ type: 'decimal', precision: 12, scale: 2, name: 'precio_venta_snapshot', nullable: true })
    precioVentaSnapshot: number;

    @Column({ type: 'decimal', precision: 12, scale: 2, name: 'subtotal_precio_venta_snapshot', nullable: true })
    subtotalPrecioVentaSnapshot: number;

    @Column({ type: 'decimal', precision: 12, scale: 2, name: 'utilidad_snapshot', nullable: true })
    utilidadSnapshot: number;

    @ManyToOne( () => ProductoServicio, { nullable: true })
    @JoinColumn({name: 'id_producto_servicio'})
    productoServicio: ProductoServicio;

    @ManyToOne( () => Producto, { nullable: true })
    @JoinColumn({name: 'id_producto'})
    producto: Producto;

    @ManyToOne( () => Servicio, { nullable: true })
    @JoinColumn({name: 'id_servicio'})
    servicio: Servicio;

    @ManyToOne( () => Orden, (orden) => orden.conceptos, { onDelete: 'RESTRICT'})
    @JoinColumn({ name: 'id_orden'})
    orden: Orden

    @Column({
        type: 'enum',
        enum: EnumEstatusConceptoOrden,
        default: EnumEstatusConceptoOrden.VIGENTE
    })
    estatus: EnumEstatusConcepto;

}
