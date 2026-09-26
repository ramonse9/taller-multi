import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity({ name:'pub_sat_formas_pagos', schema:'public' })
export class SatFormaPago {
  
  @PrimaryColumn()
  clave: string;    
  
  @Column()
  descripcion: string;

  @Column()
  bancarizado: boolean;
  
}