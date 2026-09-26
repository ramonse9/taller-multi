import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity({ name:'pub_sat_metodos_pagos', schema:'public' })
export class SatMetodoPago {
  
  @PrimaryColumn()
  clave: string;    
  
  @Column()
  descripcion: string;
  
}