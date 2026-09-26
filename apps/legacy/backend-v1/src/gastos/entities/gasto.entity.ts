import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { IsBoolean } from 'class-validator';
import { AuditableEntity } from '../../auth/entities/auditable.entity';
import { GastoCategoria } from './gasto_categoria.entity';
import { GastoMovimiento } from './gasto_movimiento.entity';
//import { Gasto } from './gasto_movimiento.entity';

//@Column({ type: 'decimal', precision: 10, scale: 2 })
//monto: number;

@Entity('pri_gastos')
export class Gasto extends AuditableEntity {
  @PrimaryColumn()
  id: string;

  @Column({type: 'varchar', length: 50})
  nombre: string

  @Column({ type: 'boolean', name: 'recurrente', default: false })
  @IsBoolean()
  recurrente: boolean;

  @Column({ type: 'boolean', name: 'activo', default: true })
  @IsBoolean()
  activo: boolean;

  @ManyToOne( () => GastoCategoria)
  @JoinColumn({name: 'id_gasto_categoria'})
  gastoCategoria: GastoCategoria;

  @OneToMany(() => GastoMovimiento, gasto => gasto.gasto)
  gastosMovimientos: GastoMovimiento[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}