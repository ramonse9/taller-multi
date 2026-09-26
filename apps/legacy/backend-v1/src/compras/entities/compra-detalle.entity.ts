import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Producto } from '../../productos/entities/producto.entity';
import { Compra } from './compra.entity';

@Entity('pri_compras_detalle')
export class CompraDetalle {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Compra, (compra) => compra.detalles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_compra' })
  compra: Compra;

  @ManyToOne(() => Producto)
  @JoinColumn({ name: 'id_producto' })
  producto: Producto;

  @Column({ type: 'decimal', precision: 12, scale: 3 })
  cantidad: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    name: 'costo_unitario',
  })
  costoUnitario: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  subtotal: number;
}
