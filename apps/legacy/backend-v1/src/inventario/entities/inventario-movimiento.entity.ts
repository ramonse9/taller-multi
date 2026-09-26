import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import {
  EnumMotivoMovimientoInventario,
  EnumTipoMovimientoInventario,
} from '../../commom/enums/general.enum';
import { Producto } from '../../productos/entities/producto.entity';
import { InventarioLote } from './inventario-lote.entity';

@Entity('pri_inventario_movimientos')
export class InventarioMovimiento {
  @PrimaryColumn()
  id: string;

  @ManyToOne(() => Producto)
  @JoinColumn({ name: 'id_producto' })
  producto: Producto;

  @ManyToOne(() => InventarioLote, { nullable: true })
  @JoinColumn({ name: 'id_lote' })
  lote: InventarioLote;

  @Column({
    type: 'enum',
    enum: EnumTipoMovimientoInventario,
    name: 'tipo_movimiento',
  })
  tipoMovimiento: EnumTipoMovimientoInventario;

  @Column({
    type: 'enum',
    enum: EnumMotivoMovimientoInventario,
    name: 'motivo_movimiento',
  })
  motivoMovimiento: EnumMotivoMovimientoInventario;

  @Column({ type: 'int' })
  cantidad: number;

  @Column({
    type: 'int',    
    name: 'stock_anterior',
  })
  stockAnterior: number;

  @Column({
    type: 'int',
    name: 'stock_nuevo',
  })
  stockNuevo: number;
  
  /*
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
  */

  @Column({ name: 'referencia_tabla', nullable: true })
  referenciaTabla: string;

  @Column({ name: 'id_referencia', nullable: true })
  idReferencia: string;

  @Column({ type: 'text', nullable: true })
  observaciones: string;

  @Column({ default: false })
  cancelado: boolean;

  @ManyToOne(() => InventarioMovimiento, { nullable: true })
  @JoinColumn({ name: 'id_movimiento_reversa' })
  movimientoReversa: InventarioMovimiento;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
