import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity({ name:'pub_sat_monedas', schema:'public' })
export class SatMoneda {
  
  @PrimaryColumn()
  clave: string;    
  
  @Column()
  descripcion: string;
  
}