import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity({ name:'pub_sat_tipos_comprobantes', schema:'public' })
export class SatTipoComprobante {
  
  @PrimaryColumn()
  clave: string;    
  
  @Column()
  descripcion: string;
  
}