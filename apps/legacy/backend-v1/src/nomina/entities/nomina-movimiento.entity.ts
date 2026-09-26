import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";
import { NominaPeriodo } from "./nomina-periodo.entity";
import { NominaMovimientoDetalle } from "./nomina-movimiento-detalle.entity";
import { AuditableEntity } from "../../auth/entities/auditable.entity";
import { EnumNominaMovimientoEstatus } from "../../commom/enums/general.enum";
import { IsDecimal } from "class-validator";
import { Empleado } from "../../empleados/entities/empleado.entity";

@Entity('pri_nomina_movimientos')
export class NominaMovimiento extends AuditableEntity {

  @PrimaryColumn()
  id: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'salario_base' })    
  @IsDecimal({ decimal_digits: '0,2' }, { message: 'El Salario Base debe ser un número con hasta dos decimales' })
  salarioBase: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, name: 'total_percepciones' })
  totalPercepciones: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, name: 'total_deducciones' })
  totalDeducciones: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, name: 'total_neto' })
  totalNeto: number; // El "pago para llevar" (Percepciones - Deducciones)

  @Column({ type: 'date', name: 'fecha', nullable: true })
  fecha: Date;

  @Column({
      type: 'enum',
      enum: EnumNominaMovimientoEstatus,
      default: EnumNominaMovimientoEstatus.ACTIVO
  })
  estatus: EnumNominaMovimientoEstatus;

  @ManyToOne(() => Empleado, { nullable: false })
  @JoinColumn({ name: 'id_empleado' })
  empleado: Empleado;

  @ManyToOne(() => NominaPeriodo, { nullable: false })
  @JoinColumn({ name: 'id_periodo' })
  nominaPeriodo: NominaPeriodo;

  @OneToMany(() => NominaMovimientoDetalle, (detalle) => detalle.movimiento, { cascade: true })
  nominaMovimientoDetalles: NominaMovimientoDetalle[];

}