import { Column, CreateDateColumn, Entity, PrimaryColumn } from "typeorm";
import { AuditableEntity } from "../../auth/entities/auditable.entity";
import { IsDecimal } from "class-validator";

@Entity('pri_empleados')
export class Empleado extends AuditableEntity {

  @PrimaryColumn()
  id: string;

  @Column({ type: 'text' })
  nombre: string;
  
  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'salario_base' })    
  @IsDecimal({ decimal_digits: '0,2' }, { message: 'El Salario Base debe ser un número con hasta dos decimales' })
  salarioBase: number;
  
  @Column({ type: 'boolean', default: true })
  activo: boolean;
  
  @CreateDateColumn({type: 'timestamptz'})
  createdAt: Date;
}

//@Column({ type: 'text', nullable: true })
//puesto?: string;