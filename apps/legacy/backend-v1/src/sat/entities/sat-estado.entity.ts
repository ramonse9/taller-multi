import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { SatPais } from "./sat-pais.entity";

@Entity({ name:'pub_sat_estado', schema:'public' })
export class SatEstado {
  
  @PrimaryColumn()
  clave: string;
  
  @Column()
  descripcion: string;

  @Column({type: 'varchar', name: 'clave_pais'})
  clavePais: string;

  @ManyToOne(() => SatPais, pais => pais.estados )
  @JoinColumn({name: 'clave_pais', referencedColumnName: 'clave'})
  pais: SatPais;
  
}