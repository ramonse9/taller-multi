import { Column, Entity, OneToMany, PrimaryColumn } from "typeorm";
import { SatUsoCFDIRegimenFiscal } from "./sat-uso-cfdi-regimen-fiscal.entity";

@Entity({name: 'pub_sat_regimenes_fiscales', schema:'public'})
export class SatRegimenFiscal {

    @PrimaryColumn()
    clave: string;

    @Column()
    descripcion: string;
    
    @Column()
    fisica: boolean;

    @Column()
    moral: boolean;

    @OneToMany(() => SatUsoCFDIRegimenFiscal, ur => ur.regimenFiscal)
    usos: SatUsoCFDIRegimenFiscal[];

}
