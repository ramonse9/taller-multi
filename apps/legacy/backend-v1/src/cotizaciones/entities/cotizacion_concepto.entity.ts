import { ProductoServicio } from "./../../productos-servicios/entities/producto-servicio.entity";
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Cotizacion } from "./cotizacion.entity"

@Entity('pri_cotizaciones_conceptos')
export class CotizacionConcepto{
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    cantidad: number;

    @Column()
    valorUnitario: number;

    @ManyToOne( () => ProductoServicio)
    @JoinColumn({name: 'id_producto_servicio'})
    productoServicio: ProductoServicio;

    @ManyToOne( () => Cotizacion, (cotizacion) => cotizacion.conceptos, { onDelete: 'RESTRICT'} )
    @JoinColumn({name: 'id_cotizacion'})
    cotizacion: Cotizacion;

}