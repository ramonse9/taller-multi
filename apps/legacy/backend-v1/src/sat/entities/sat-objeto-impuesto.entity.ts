import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity({ name:'pub_sat_objetos_impuestos', schema:'public' })
export class SatObjetoImpuesto {
  
  @PrimaryColumn()
  clave: string;    
  
  @Column()
  descripcion: string;
  
}