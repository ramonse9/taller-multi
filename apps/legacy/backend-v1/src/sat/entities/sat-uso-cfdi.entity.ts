import { Column, Entity, OneToMany, PrimaryColumn } from "typeorm";
import { SatUsoCFDIRegimenFiscal } from "./sat-uso-cfdi-regimen-fiscal.entity";

@Entity({name: 'pub_sat_uso_cfdi', schema: 'public'})
export class SatUsoCFDI{

    @PrimaryColumn()
    clave: string;

    @Column()
    descripcion: string;

    @Column()
    fisica: boolean;

    @Column()
    moral: boolean;

    @OneToMany(() => SatUsoCFDIRegimenFiscal, ur => ur.usoCfdi)
    regimenes: SatUsoCFDIRegimenFiscal[];

}