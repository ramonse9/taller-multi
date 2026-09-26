import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { AuditableEntity } from "../../auth/entities/auditable.entity";
import { EnumNominaPeriodicidad } from "../../commom/enums/general.enum";

@Entity({ name:'pri_nomina_periodos'})
export class NominaPeriodo extends AuditableEntity {

  @PrimaryGeneratedColumn()
  id: number;
  
  @Column({type: 'int'})
  anio: number;
  
  @Column({ type: 'enum', enum: EnumNominaPeriodicidad, default: EnumNominaPeriodicidad.SEMANAL })
  periodicidad: EnumNominaPeriodicidad;

  @Column({ type: 'text' })
  nombre: string;

  @Column({ type: 'date', name: 'fecha_inicio' })
  fechaInicio: Date;

  @Column({ type: 'date', name: 'fecha_fin' })
  fechaFin: Date;

}
