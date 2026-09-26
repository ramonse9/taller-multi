import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity({ name:'pub_sat_tipos_relaciones', schema:'public' })
export class SatTipoRelacion {
  
  @PrimaryColumn()
  clave: string;    
  
  @Column()
  descripcion: string;
  
}