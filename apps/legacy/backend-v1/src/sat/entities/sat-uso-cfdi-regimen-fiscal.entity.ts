import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { SatUsoCFDI } from "./sat-uso-cfdi.entity";
import { SatRegimenFiscal } from "./sat-regimen-fiscal.entity";

@Entity({name: 'pub_sat_uso_cfdi_regimen_fiscal', schema: 'public'})
export class SatUsoCFDIRegimenFiscal{

    @PrimaryColumn({name: 'clave_sat_uso_cfdi', type: 'varchar'})
    claveUsoCFDI: string;

    @PrimaryColumn({name: 'clave_sat_regimen_fiscal', type: 'int'})
    claveRegimenFiscal: number;

    @ManyToOne(() => SatUsoCFDI, uso => uso.regimenes)
    @JoinColumn({ name: 'clave_sat_uso_cfdi' })
    usoCfdi: SatUsoCFDI;

    @ManyToOne(() => SatRegimenFiscal, regimen => regimen.usos)
    @JoinColumn({ name: 'clave_sat_regimen_fiscal' })
    regimenFiscal: SatRegimenFiscal;

}