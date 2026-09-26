import { EnumTipoPagoGasto } from '../../commom/enums/general.enum';
import { Entity, PrimaryColumn, Column, CreateDateColumn, JoinColumn, ManyToOne, UpdateDateColumn } from 'typeorm';
import { IsDecimal } from 'class-validator';
import { AuditableEntity } from '../../auth/entities/auditable.entity';
import { Gasto } from './gasto.entity';
//import { GastoConcepto } from './gasto_concepto.entity';

//TODO
/*@ManyToOne(() => Proveedor, { nullable: true })
@JoinColumn({ name: 'proveedor_id' })
proveedor?: Proveedor;
*/

//TODO
/*
@OneToOne(() => CuentaPorPagar, cuenta => cuenta.gasto)
cuentaPorPagar?: CuentaPorPagar;*/

@Entity('pri_gastos_movimientos')
export class GastoMovimiento extends AuditableEntity {

  @PrimaryColumn()
  id: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'monto' })    
  @IsDecimal({ decimal_digits: '0,2' }, { message: 'El monto debe ser un número con hasta dos decimales' })
  monto: number;

  @Column({ type: 'timestamptz', name: 'fecha' })
  fecha: Date;

  @Column({ type: 'enum', enum: EnumTipoPagoGasto, default: EnumTipoPagoGasto.CONTADO })
  tipoPago: EnumTipoPagoGasto;

  @ManyToOne( () => Gasto )
  @JoinColumn({ name: 'id_gasto'})
  gasto: Gasto;

  @Column({type: 'text', nullable: true})
  referencia?: string
  
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
  
  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
  
}