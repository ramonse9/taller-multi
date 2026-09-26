import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity({name: 'pub_sat_tipos_personas', schema:'public'})
export class SatTipoPersona {

    @PrimaryColumn()
    tipo: string;

    @Column()
    retenciones: boolean;
}