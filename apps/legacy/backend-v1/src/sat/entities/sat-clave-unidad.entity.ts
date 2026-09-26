import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity({ name:'pub_sat_claves_unidades', schema:'public' })
export class SatClaveUnidad {
  
  @PrimaryColumn()
  clave: string;
  
  @Column()
  nombre: string;
  
  @Column()
  descripcion: string;

  @Column()
  nota: string;
  
}