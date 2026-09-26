import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { Producto } from '../../productos/entities/producto.entity';
import { CompraDetalle } from '../../compras/entities/compra-detalle.entity';

@Entity('pri_inventario_lotes')
@Index('idx_lotes_producto', ['idProducto'])
@Index('idx_lotes_disponible', ['cantidadDisponible'])
@Index('idx_lotes_producto_fifo', ['idProducto', 'fechaEntrada'])
export class InventarioLote {
  @PrimaryColumn()
  id: string;

  @Column({ name: 'id_producto' })
  idProducto: string;

  @ManyToOne(() => Producto)
  @JoinColumn({ name: 'id_producto' })
  producto: Producto;

  @ManyToOne(() => CompraDetalle, { nullable: true })
  @JoinColumn({ name: 'id_compra_detalle' })
  compraDetalle: CompraDetalle;

  @Column({
    type: 'int',    
    name: 'cantidad_inicial',
  })
  cantidadInicial: number;

  @Column({
    type: 'int',
    name: 'cantidad_disponible',
  })
  cantidadDisponible: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    name: 'costo_unitario',
  })
  costoUnitario: number;

  @Column({ type: 'timestamptz', name: 'fecha_entrada' })
  fechaEntrada: Date;

  @Column({ default: true })
  activo: boolean;
  
  @CreateDateColumn({type: 'timestamptz'})
  createdAt: Date;
}
