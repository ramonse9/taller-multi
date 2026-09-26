import { IsString, Matches } from "class-validator";
import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity({ name:'pub_sat_impuestos', schema:'public' })
export class SatImpuesto {

  @PrimaryColumn()
  @IsString()  
  clave: string;

  @Column()
  @IsString()
  @Matches(/^(iva|isr|ieps)$/, {
    message: '02 Descripción de impuesto no válida',
  })
  descripcion: string;

  @Column()  
  retencion: boolean;
  
  @Column()  
  traslado: boolean;
  
}