import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { AuditableEntity } from "../../auth/entities/auditable.entity";
import { Gasto } from "./gasto.entity";

@Entity({name:'pri_gastos_categorias'})
export class GastoCategoria extends AuditableEntity {

  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text', unique: true })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion?: string;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @OneToMany( () => Gasto, (gasto) => gasto.gastoCategoria )
  gastos: Gasto[]
}
