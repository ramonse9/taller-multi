import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { OrdenConcepto } from '../../ordenes/entities/orden_concepto.entity';
import { InventarioLote } from './inventario-lote.entity';

@Entity('pri_ordenes_conceptos_inventario')
export class OrdenConceptoInventario {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => OrdenConcepto, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'id_orden_concepto' })
  ordenConcepto: OrdenConcepto;

  @ManyToOne(() => InventarioLote)
  @JoinColumn({ name: 'id_lote' })
  lote: InventarioLote;

  @Column({ type: 'int' })
  cantidad: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    name: 'costo_unitario',
  })
  costoUnitario: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    name: 'subtotal_costo',
  })
  subtotalCosto: number;

  @Column({ default: false })
  cancelado: boolean;

  @ManyToOne(() => OrdenConceptoInventario, { nullable: true })
  @JoinColumn({ name: 'id_reversa' })
  reversa: OrdenConceptoInventario;  
  
}
