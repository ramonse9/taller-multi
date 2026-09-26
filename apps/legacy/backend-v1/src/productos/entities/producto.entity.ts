import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AuditableEntity } from '../../auth/entities/auditable.entity';
import { SatProductoServicio } from '../../sat/entities/sat-producto-servicio.entity';
import { ProductoServicio } from '../../productos-servicios/entities/producto-servicio.entity';

@Entity('pri_productos')
export class Producto extends AuditableEntity {
  @PrimaryColumn()
  id: string;

  @Column()
  descripcion: string;

  @Column({ nullable: true })
  sku: string;

  @Column({ name: 'codigo_barras', nullable: true })
  codigoBarras: string;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    name: 'precio_venta',
  })
  precioVenta: number;

  @Column({
    type: 'int',
    name: 'stock_actual',
    default: 0,
  })
  stockActual: number;

  @Column({
    type: 'int',    
    name: 'stock_minimo',
    default: 0,
  })
  stockMinimo: number;

  //@Column({ name: 'maneja_inventario', default: true })
  //manejaInventario: boolean;

  @Column({ name: 'permite_venta_sin_stock', default: false })
  permiteVentaSinStock: boolean;

  @Column({ default: true })
  activo: boolean;

  @ManyToOne(() => SatProductoServicio)
  @JoinColumn({ name: 'id_sat_producto_servicio' })
  satProductoServicio: SatProductoServicio;

  @ManyToOne(() => ProductoServicio, { nullable: true })
  @JoinColumn({ name: 'id_producto_servicio_legacy' })
  productoServicioLegacy: ProductoServicio;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
