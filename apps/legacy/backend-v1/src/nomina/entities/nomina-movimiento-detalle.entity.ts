import { EnumNominaMovimientoTipo } from "../../commom/enums/general.enum";
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { NominaMovimiento } from "./nomina-movimiento.entity";

@Entity('pri_nomina_movimientos_detalles')
export class NominaMovimientoDetalle {

  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  concepto: string; // Ej: "ISR", "Seguro Social", "Sueldo Quincenal"
  
  @Column({ type: 'decimal', precision: 12, scale: 2 })
  monto: number;
  
  @Column({ type: 'enum', enum: EnumNominaMovimientoTipo, default: EnumNominaMovimientoTipo.PERCEPCION})
  tipo: EnumNominaMovimientoTipo;

  @ManyToOne(() => NominaMovimiento, (mov) => mov.nominaMovimientoDetalles, { onDelete: 'CASCADE' })
  @JoinColumn({name: 'id_movimiento'})
  movimiento: NominaMovimiento;
}