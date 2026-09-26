import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity({ name:'pub_sat_exportaciones', schema:'public' })
export class SatExportacion {
  
  @PrimaryColumn()
  clave: string;    
  
  @Column()
  descripcion: string;
  
}