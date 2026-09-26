import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity({name: 'pub_sat_cancelaciones_motivos', schema: 'public'})
export class SatCancelacionMotivo{
    @PrimaryColumn()
    clave: string;

    @Column()
    descripcion: string

}