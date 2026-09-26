import { Column, CreateDateColumn, Entity, PrimaryColumn } from "typeorm";

@Entity({name: 'pub_sat_retenciones_iva', schema:'public'})
export class SatRetencionIVA {

    @PrimaryColumn()
    id: string;

    @Column('numeric', {precision: 6, scale: 4})
    porcentaje: number;    

    @CreateDateColumn({type: 'timestamptz'})        
    createdAt: Date;
}