import { Column, Entity, OneToMany, PrimaryColumn } from "typeorm";
import { SatEstado } from "./sat-estado.entity";

@Entity({ name:'pub_sat_pais', schema:'public' })
export class SatPais {
  
  @PrimaryColumn()
  clave: string;
  
  @Column()
  descripcion: string;

  @OneToMany( () => SatEstado, estado => estado.pais)
  estados: SatEstado[]
  
}