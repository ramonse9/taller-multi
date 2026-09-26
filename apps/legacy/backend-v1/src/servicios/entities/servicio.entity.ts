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

@Entity('pri_servicios')
export class Servicio extends AuditableEntity {
  @PrimaryColumn()
  id: string;

  @Column()
  descripcion: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  precioVenta: number;

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
