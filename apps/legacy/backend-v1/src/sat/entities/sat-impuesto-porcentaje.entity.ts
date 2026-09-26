import { SatImpuesto } from './sat-impuesto.entity';
import { IsDecimal, IsString, Matches } from "class-validator";
import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";

@Entity({ name:'pub_sat_impuestos_porcentajes', schema:'public' })
export class SatImpuestoPorcentaje {

  @PrimaryColumn()
  @IsString()
  @Matches(/^(iva_rate|isr_retention_pf_actividad_empresarial|isr_retention_pf_resico|iva_retention_rate)$/, {
    message: 'Clave de impuesto no válida',
  })
  clave: string;

  @Column()
  @IsString()
  descripcion: string;

  @Column({ type: 'decimal', precision: 10, scale: 6 })
  @IsDecimal({ decimal_digits: '0,6' }, { message: 'La tasa debe tener hasta seis decimales' })
  tasa: string;

  @Column()
  @IsString()
  @Matches(/^(TRASLADO|RETENCION)$/, {
    message: 'El tipo debe ser TRASLADO o RETENCION',
  })
  tipo: 'TRASLADO' | 'RETENCION';

  @Column()
  @IsString()
  @Matches(/^(SUMA|RESTA)&/, {
    message: 'La operacion debe ser SUMA o RESTA'
  })
  operacion: 'SUMA' | 'RESTA'

  @ManyToOne( () => SatImpuesto, {eager: true})
  @JoinColumn({name: 'clave_sat_impuesto'})
  satImpuesto: SatImpuesto;
  
}